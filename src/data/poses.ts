import { PoseTarget } from '../types.ts';

export const POSE_TARGETS: PoseTarget[] = [
  {
    id: 'red-carpet',
    name: 'The Red Carpet Splay',
    tagline: 'Shoulders squared, hand on hip, chin high',
    description: 'The definitive Cannes film festival pose. Places one hand confidentially on hip while keeping the opposite arm relaxed.',
    difficulty: 'Easy',
    idealAngles: {
      leftShoulderElbow: 65,   // left arm angled to hip
      rightShoulderElbow: 20,  // right arm resting down
      leftElbowWrist: 85,
      rightElbowWrist: 15,
      shoulderTilt: 5,         // slight asymmetry
      torsoRotation: 15,
    },
    coachTips: {
      armsDown: 'Bring your left hand onto your hip to strike the pose!',
      armsWrong: 'Bend your left elbow outwards toward your side',
      shouldersWrong: 'Square your shoulders and lift your chin slightly',
      almostThere: 'Great stance! Turn shoulders 10° toward the lights',
      perfect: 'Flawless red carpet posture! Hold for 2 seconds to snap!',
    },
  },
  {
    id: 'namaste-swag',
    name: 'Festive Royal Namaste',
    tagline: 'Regal greeting with hands folded at sternum',
    description: 'Traditional royal greeting with elbows flared and a gentle head tilt. Perfect for showcasing sherwanis, kurtas, and festive drapes.',
    difficulty: 'Medium',
    idealAngles: {
      leftShoulderElbow: 55,
      rightShoulderElbow: 55,
      leftElbowWrist: 75,
      rightElbowWrist: 75,
      shoulderTilt: 0,
      torsoRotation: 0,
    },
    coachTips: {
      armsDown: 'Raise both hands up towards chest level',
      armsWrong: 'Bring palms together near heart center and widen elbows',
      shouldersWrong: 'Relax shoulders and keep chest proud and upright',
      almostThere: 'Tilt head slightly and smile with festive elegance',
      perfect: 'Regal perfection! Hold for 2 seconds to capture!',
    },
  },
  {
    id: 'power-stance',
    name: 'Action Hero Power Stance',
    tagline: 'Wide chest, clenched fists, cinematic grit',
    description: 'Dynamic superhero silhouette. Both elbows bent out with fists raised slightly near chest level, commanding the entire room.',
    difficulty: 'Medium',
    idealAngles: {
      leftShoulderElbow: 45,
      rightShoulderElbow: 45,
      leftElbowWrist: 90,
      rightElbowWrist: 90,
      shoulderTilt: 2,
      torsoRotation: 5,
    },
    coachTips: {
      armsDown: 'Bring both elbows out wide and raise your forearms',
      armsWrong: 'Flex your arms outward into an action hero stance',
      shouldersWrong: 'Puff out your chest and stand wide',
      almostThere: 'Lock in that powerful heroic gaze!',
      perfect: 'Heroic energy locked! Hold for 2 seconds!',
    },
  },
  {
    id: 'cyber-over-shoulder',
    name: 'Cyberpunk Over-the-Shoulder',
    tagline: '3/4 back turn, looking back at the camera',
    description: 'Moody sci-fi detective silhouette. Body angled away with face turning back over the shoulder.',
    difficulty: 'Pro',
    idealAngles: {
      leftShoulderElbow: 30,
      rightShoulderElbow: 40,
      leftElbowWrist: 45,
      rightElbowWrist: 30,
      shoulderTilt: 12,
      torsoRotation: 40,
    },
    coachTips: {
      armsDown: 'Turn your torso sideways to a 45° angle',
      armsWrong: 'Keep your body turned while angling face towards camera',
      shouldersWrong: 'Drop the front shoulder slightly for dramatic silhouette',
      almostThere: 'Intense cinematic gaze over the collar!',
      perfect: 'Incredible cyberpunk noir aesthetic! Hold it!',
    },
  },
];
