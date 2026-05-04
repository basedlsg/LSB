const fs = require('fs');
const file = 'components/shared/CanvasLayout.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("import { Canvas } from '@react-three/fiber';", "import { Canvas } from '@react-three/fiber';\nimport { View } from '@react-three/drei';");
content = content.replace("<StarParticles />", "<StarParticles />\n          <View.Port />");
fs.writeFileSync(file, content);
