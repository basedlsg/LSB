import React, { useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleSystem } from './ParticleSystem';
import {
    getStickPoints,
    getTextPoints,
    getTerrainPoints,
    getMapPoints,
    getCompassPoints,
    getLensPoints,
    getQuestionMarkPoints,
    PARTICLE_COUNT
} from './utils/particleGenerators';

interface ParticleExperienceProps {
    scrollProgress: number;
    mouse: THREE.Vector2;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export default function ParticleExperience({ scrollProgress }: ParticleExperienceProps) {
    // Pre-calculate all shapes
    const shapes = useMemo(() => {
        return {
            sphere: getStickPoints(PARTICLE_COUNT), // Start with stick or random
            stick: getStickPoints(PARTICLE_COUNT),
            wordStick: getTextPoints("THE STICK", PARTICLE_COUNT),
            terrain: getTerrainPoints(PARTICLE_COUNT),
            map: getMapPoints(PARTICLE_COUNT),
            compass: getCompassPoints(PARTICLE_COUNT),
            lens: getLensPoints(PARTICLE_COUNT),
            question: getQuestionMarkPoints(PARTICLE_COUNT),
            labName: getTextPoints("Walking Stick\nLabs", PARTICLE_COUNT),
            finalStick: getStickPoints(PARTICLE_COUNT), // Scaled up stick for background
        };
    }, []);

    // State for interpolation
    const [currentShape, setCurrentShape] = useState(shapes.stick);
    const [targetShape, setTargetShape] = useState(shapes.stick);
    const [progress, setProgress] = useState(0);

    useFrame(() => {
        // Logic to determine shapes based on scrollProgress
        // Sections are roughly 1/6th each (~0.166)

        let startShape = shapes.stick;
        let endShape = shapes.stick;
        let localProgress = 0;

        if (scrollProgress < 0.1) {
            // 0.0 - 0.1: Intro -> Stick
            startShape = shapes.stick;
            endShape = shapes.stick;
            localProgress = 0;
        } else if (scrollProgress < 0.25) {
            // 0.1 - 0.25: Stick -> Word "THE STICK"
            // Morph happens in the second half of this section
            const sectionStart = 0.1;
            const sectionEnd = 0.25;
            const t = (scrollProgress - sectionStart) / (sectionEnd - sectionStart);
            startShape = shapes.stick;
            endShape = shapes.wordStick;
            localProgress = THREE.MathUtils.smoothstep(t, 0.5, 1.0);
        } else if (scrollProgress < 0.45) {
            // 0.25 - 0.45: Word -> Terrain
            const sectionStart = 0.25;
            const sectionEnd = 0.45;
            const t = (scrollProgress - sectionStart) / (sectionEnd - sectionStart);
            startShape = shapes.wordStick;
            endShape = shapes.terrain;
            localProgress = THREE.MathUtils.smoothstep(t, 0.0, 0.8);
        } else if (scrollProgress < 0.65) {
            // 0.45 - 0.65: Evolution Sequence
            // Terrain -> Stick -> Map -> Compass -> Lens -> Question
            const sectionStart = 0.45;
            const sectionEnd = 0.65;
            const t = (scrollProgress - sectionStart) / (sectionEnd - sectionStart);

            // Sub-divide this range into 5 steps
            const step = 1 / 5;

            if (t < step) { // Terrain -> Stick
                startShape = shapes.terrain;
                endShape = shapes.stick;
                localProgress = t / step;
            } else if (t < step * 2) { // Stick -> Map
                startShape = shapes.stick;
                endShape = shapes.map;
                localProgress = (t - step) / step;
            } else if (t < step * 3) { // Map -> Compass
                startShape = shapes.map;
                endShape = shapes.compass;
                localProgress = (t - step * 2) / step;
            } else if (t < step * 4) { // Compass -> Lens
                startShape = shapes.compass;
                endShape = shapes.lens;
                localProgress = (t - step * 3) / step;
            } else { // Lens -> Question
                startShape = shapes.lens;
                endShape = shapes.question;
                localProgress = (t - step * 4) / step;
            }

        } else if (scrollProgress < 0.85) {
            // 0.65 - 0.85: Question -> Lab Name
            const sectionStart = 0.65;
            const sectionEnd = 0.85;
            const t = (scrollProgress - sectionStart) / (sectionEnd - sectionStart);
            startShape = shapes.question;
            endShape = shapes.labName;
            localProgress = THREE.MathUtils.smoothstep(t, 0.2, 0.8);
        } else {
            // 0.85 - 1.0: Lab Name -> Final Stick (Background)
            const sectionStart = 0.85;
            const sectionEnd = 1.0;
            const t = (scrollProgress - sectionStart) / (sectionEnd - sectionStart);
            startShape = shapes.labName;
            endShape = shapes.finalStick;
            localProgress = THREE.MathUtils.smoothstep(t, 0.0, 1.0);
        }

        // Update state only if changed to avoid unnecessary re-renders of geometry
        // Actually, we pass these to ParticleSystem which handles the mix in shader.
        // But we need to pass the correct arrays.
        // To avoid recreating geometry every frame, we should pass "current" and "next" 
        // and let the shader mix. But here we have a chain of morphs.
        // The ParticleSystem takes 'currentPoints' and 'targetPoints' and 'progress'.
        // So we just pass startShape, endShape, and localProgress.

        setCurrentShape(startShape);
        setTargetShape(endShape);
        setProgress(localProgress);
    });

    return (
        <group position={[0, 0, 0]}>
            <ParticleSystem
                currentPoints={currentShape}
                targetPoints={targetShape}
                progress={progress}
            />
        </group>
    );
}
