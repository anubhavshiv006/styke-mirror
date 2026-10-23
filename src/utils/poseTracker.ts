import { Keypoint, PoseFeedback, PoseTarget } from '../types.ts';

// Helper to calculate angle between three points in degrees (vertex at B)
export function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };

  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);

  if (magAB === 0 || magCB === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

// Generate natural synthetic keypoints for testing or simulation
export function getSimulatedKeypoints(
  targetPose: PoseTarget,
  variation: { armSway: number; shoulderTilt: number; postureDrift: number }
): Record<string, Keypoint> {
  const t = targetPose.id;
  const baseTilt = (variation.shoulderTilt * 0.05);

  let lsX = 0.38, lsY = 0.32 + baseTilt;
  let rsX = 0.62, rsY = 0.32 - baseTilt;

  let leX = 0.32, leY = 0.50;
  let reX = 0.68, reY = 0.50;

  let lwX = 0.30, lwY = 0.68;
  let rwX = 0.70, rwY = 0.68;

  if (t === 'red-carpet') {
    // Left hand on hip, right arm down
    leX = 0.28 + variation.armSway * 0.03;
    leY = 0.45;
    lwX = 0.36;
    lwY = 0.52; // hand resting on left hip

    reX = 0.66;
    reY = 0.48;
    rwX = 0.68;
    rwY = 0.68;
  } else if (t === 'namaste-swag') {
    // Both hands near chest center
    leX = 0.36 + variation.armSway * 0.02;
    leY = 0.46;
    reX = 0.64 - variation.armSway * 0.02;
    reY = 0.46;

    lwX = 0.48;
    lwY = 0.42;
    rwX = 0.52;
    rwY = 0.42;
  } else if (t === 'power-stance') {
    // Wide elbows, clenched fists
    leX = 0.25 + variation.armSway * 0.03;
    leY = 0.42;
    reX = 0.75 - variation.armSway * 0.03;
    reY = 0.42;

    lwX = 0.32;
    lwY = 0.35;
    rwX = 0.68;
    rwY = 0.35;
  } else if (t === 'cyber-over-shoulder') {
    // 3/4 turn
    lsX = 0.42;
    lsY = 0.34;
    rsX = 0.66;
    rsY = 0.30;

    leX = 0.38;
    leY = 0.52;
    reX = 0.72;
    reY = 0.48;

    lwX = 0.40;
    lwY = 0.65;
    rwX = 0.75;
    rwY = 0.62;
  }

  return {
    nose: { name: 'nose', x: 0.5 + (variation.postureDrift * 0.02), y: 0.20, confidence: 0.95 },
    left_shoulder: { name: 'left_shoulder', x: lsX, y: lsY, confidence: 0.92 },
    right_shoulder: { name: 'right_shoulder', x: rsX, y: rsY, confidence: 0.92 },
    left_elbow: { name: 'left_elbow', x: leX, y: leY, confidence: 0.88 },
    right_elbow: { name: 'right_elbow', x: reX, y: reY, confidence: 0.88 },
    left_wrist: { name: 'left_wrist', x: lwX, y: lwY, confidence: 0.85 },
    right_wrist: { name: 'right_wrist', x: rwX, y: rwY, confidence: 0.85 },
    left_hip: { name: 'left_hip', x: 0.42, y: 0.58, confidence: 0.89 },
    right_hip: { name: 'right_hip', x: 0.58, y: 0.58, confidence: 0.89 },
  };
}

// Evaluate detected user pose against target pose
export function evaluatePose(
  keypoints: Record<string, Keypoint>,
  target: PoseTarget,
  currentHoldMs: number,
  requiredHoldMs: number = 2000
): PoseFeedback {
  const ls = keypoints['left_shoulder'];
  const rs = keypoints['right_shoulder'];
  const le = keypoints['left_elbow'];
  const re = keypoints['right_elbow'];
  const lw = keypoints['left_wrist'];
  const rw = keypoints['right_wrist'];

  if (!ls || !rs || !le || !re || !lw || !rw) {
    return {
      score: 30,
      tip: 'Step back so your full upper body is visible in the mirror',
      isReadyToLock: false,
      holdProgress: 0,
      detectedAngles: { leftArm: 0, rightArm: 0, shoulderTilt: 0 },
    };
  }

  // Left arm angle (shoulder -> elbow -> wrist)
  const leftArmAngle = calculateAngle(ls, le, lw);
  // Right arm angle (shoulder -> elbow -> wrist)
  const rightArmAngle = calculateAngle(rs, re, rw);

  // Shoulder tilt relative to horizontal
  const shoulderDy = (rs.y - ls.y);
  const shoulderDx = (rs.x - ls.x);
  const shoulderTilt = Math.abs(Math.atan2(shoulderDy, shoulderDx) * (180 / Math.PI));

  // Compute closeness to ideal angles
  const ideal = target.idealAngles;

  // Tolerances
  const leftDiff = Math.abs(leftArmAngle - ideal.leftElbowWrist);
  const rightDiff = Math.abs(rightArmAngle - ideal.rightElbowWrist);
  const tiltDiff = Math.abs(shoulderTilt - ideal.shoulderTilt);

  // Score components (0 - 100)
  const leftScore = Math.max(0, 100 - (leftDiff * 1.2));
  const rightScore = Math.max(0, 100 - (rightDiff * 1.2));
  const tiltScore = Math.max(0, 100 - (tiltDiff * 2.5));

  const totalScore = Math.round((leftScore * 0.4) + (rightScore * 0.4) + (tiltScore * 0.2));

  // Coaching tips logic
  let tip = target.coachTips.almostThere;
  if (totalScore >= 82) {
    tip = target.coachTips.perfect;
  } else if (leftDiff > 35 && rightDiff > 35) {
    tip = target.coachTips.armsDown;
  } else if (leftDiff > 30 || rightDiff > 30) {
    tip = target.coachTips.armsWrong;
  } else if (tiltDiff > 12) {
    tip = target.coachTips.shouldersWrong;
  }

  const isReadyToLock = totalScore >= 78;
  const holdProgress = isReadyToLock 
    ? Math.min(100, Math.round((currentHoldMs / requiredHoldMs) * 100))
    : 0;

  return {
    score: totalScore,
    tip,
    isReadyToLock,
    holdProgress,
    detectedAngles: {
      leftArm: Math.round(leftArmAngle),
      rightArm: Math.round(rightArmAngle),
      shoulderTilt: Math.round(shoulderTilt),
    },
  };
}
