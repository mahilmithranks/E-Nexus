"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/utils";

const Pupil = React.memo(({
    size = 14,
    maxDistance = 6,
    pupilColor = "#1a1a1a",
    mouseX,
    mouseY,
    forceLookX,
    forceLookY
}) => {
    const pupilRef = useRef(null);

    const calculatePupilPosition = () => {
        if (!pupilRef.current) return { x: 0, y: 0 };
        if (forceLookX !== undefined && forceLookY !== undefined) {
            return { x: forceLookX, y: forceLookY };
        }
        const pupil = pupilRef.current.getBoundingClientRect();
        const pupilCenterX = pupil.left + pupil.width / 2;
        const pupilCenterY = pupil.top + pupil.height / 2;
        const deltaX = mouseX - pupilCenterX;
        const deltaY = mouseY - pupilCenterY;
        const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
    };

    const pupilPosition = calculatePupilPosition();

    return (
        <div
            ref={pupilRef}
            className="rounded-full shadow-inner"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: pupilColor,
                transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
                transition: 'transform 0.1s ease-out',
            }}
        />
    );
});

const EyeBall = React.memo(({
    size = 56,
    pupilSize = 20,
    maxDistance = 12,
    eyeColor = "#f0f0f0",
    pupilColor = "#1a1a1a",
    isBlinking = false,
    mouseX,
    mouseY,
    forceLookX,
    forceLookY
}) => {
    const eyeRef = useRef(null);

    const calculatePupilPosition = () => {
        if (!eyeRef.current) return { x: 0, y: 0 };
        if (forceLookX !== undefined && forceLookY !== undefined) {
            return { x: forceLookX, y: forceLookY };
        }
        const eye = eyeRef.current.getBoundingClientRect();
        const eyeCenterX = eye.left + eye.width / 2;
        const eyeCenterY = eye.top + eye.height / 2;
        const deltaX = mouseX - eyeCenterX;
        const deltaY = mouseY - eyeCenterY;
        const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);
        const angle = Math.atan2(deltaY, deltaX);
        return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
    };

    const pupilPosition = calculatePupilPosition();

    return (
        <div
            ref={eyeRef}
            className="rounded-full flex items-center justify-center transition-all duration-150 shadow-sm"
            style={{
                width: `${size}px`,
                height: isBlinking ? '2px' : `${size}px`,
                backgroundColor: eyeColor,
                overflow: 'hidden',
                borderRadius: '50%'
            }}
        >
            {!isBlinking && (
                <div
                    className="rounded-full"
                    style={{
                        width: `${pupilSize}px`,
                        height: `${pupilSize}px`,
                        backgroundColor: pupilColor,
                        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
                        transition: 'transform 0.1s ease-out',
                    }}
                />
            )}
        </div>
    );
});

function LoginPage({
    username,
    password: loginPassword,
    onUsernameChange,
    onPasswordChange,
    onSubmit,
    loading,
    error: loginError
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [mouseX, setMouseX] = useState(0);
    const [mouseY, setMouseY] = useState(0);
    const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
    const [isBlackBlinking, setIsBlackBlinking] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
    const [isPurplePeeking, setIsPurplePeeking] = useState(false);

    const purpleRef = useRef(null);
    const blackRef = useRef(null);
    const yellowRef = useRef(null);
    const orangeRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMouseX(e.clientX);
            setMouseY(e.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        const schedule = () => {
            const timeout = setTimeout(() => {
                setIsPurpleBlinking(true);
                setTimeout(() => {
                    setIsPurpleBlinking(false);
                    schedule();
                }, 150);
            }, Math.random() * 4000 + 3000);
            return timeout;
        };
        const t = schedule();
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const schedule = () => {
            const timeout = setTimeout(() => {
                setIsBlackBlinking(true);
                setTimeout(() => {
                    setIsBlackBlinking(false);
                    schedule();
                }, 150);
            }, Math.random() * 4000 + 3000);
            return timeout;
        };
        const t = schedule();
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (isTyping) {
            setIsLookingAtEachOther(true);
            const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
            return () => clearTimeout(timer);
        }
    }, [isTyping]);

    useEffect(() => {
        if (loginPassword.length > 0 && showPassword) {
            const schedule = () => {
                const t = setTimeout(() => {
                    setIsPurplePeeking(true);
                    setTimeout(() => setIsPurplePeeking(false), 800);
                }, Math.random() * 3000 + 2000);
                return t;
            };
            const t = schedule();
            return () => clearTimeout(t);
        } else {
            setIsPurplePeeking(false);
        }
    }, [loginPassword, showPassword]);

    const calculatePosition = (ref) => {
        if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 3;
        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;
        const faceX = Math.max(-15, Math.min(15, deltaX / 20));
        const faceY = Math.max(-10, Math.min(10, deltaY / 30));
        const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
        return { faceX, faceY, bodySkew };
    };

    const purplePos = calculatePosition(purpleRef);
    const blackPos = calculatePosition(blackRef);
    const orangePos = calculatePosition(orangeRef);

    // Brand Palette
    const BRAND_VERMILION = "#f05423";
    const BRAND_AMBER = "#ff9d00";
    const MATTE_BLACK = "#b20000";
    const MATTE_ORANGE = "#E68A5E";
    const MATTE_YELLOW = "#D1C14B";

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-[#0a0a0a] overflow-hidden" style={{ fontFamily: 'system-ui, -apple-system, blinkmacsystemfont, "Segoe UI", roboto, helvetica, arial, sans-serif' }}>
            {/* Blended Left Character Section with Subtle Gradient for Depth */}
            <div className="relative hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-[#050505] overflow-hidden p-12 order-2 lg:order-1">
                {/* Ambient glow effects */}
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#f05423]/05 blur-[120px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[30vw] h-[30vw] rounded-full bg-[#ff9d00]/05 blur-[100px]" />

                <div className="relative z-20 flex items-end justify-center h-full w-full">
                    <div className="relative scale-110 translate-y-8" style={{ width: '650px', height: '500px' }}>
                        {/* Vermilion Character (Replaced Purple) */}
                        <div
                            ref={purpleRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out"
                            style={{
                                left: '80px',
                                width: '210px',
                                height: (isTyping || (loginPassword.length > 0 && !showPassword)) ? '520px' : '480px',
                                backgroundColor: BRAND_VERMILION,
                                borderRadius: '12px 12px 0 0',
                                zIndex: 1,
                                transform: (loginPassword.length > 0 && showPassword)
                                    ? `skewX(0deg)`
                                    : (isTyping || (loginPassword.length > 0 && !showPassword))
                                        ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                                        : `skewX(${purplePos.bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            <div
                                className="absolute flex gap-10 transition-all duration-700 ease-in-out"
                                style={{
                                    left: (loginPassword.length > 0 && showPassword) ? `${25}px` : isLookingAtEachOther ? `${65}px` : `${55 + purplePos.faceX}px`,
                                    top: (loginPassword.length > 0 && showPassword) ? `${40}px` : isLookingAtEachOther ? `${75}px` : `${50 + purplePos.faceY}px`,
                                }}
                            >
                                <EyeBall size={20} pupilSize={8} maxDistance={6} isBlinking={isPurpleBlinking} mouseX={mouseX} mouseY={mouseY} forceLookX={(loginPassword.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -5) : isLookingAtEachOther ? 4 : undefined} forceLookY={(loginPassword.length > 0 && showPassword) ? (isPurplePeeking ? 6 : -5) : isLookingAtEachOther ? 5 : undefined} eyeColor="#fff" />
                                <EyeBall size={20} pupilSize={8} maxDistance={6} isBlinking={isPurpleBlinking} mouseX={mouseX} mouseY={mouseY} forceLookX={(loginPassword.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -5) : isLookingAtEachOther ? 4 : undefined} forceLookY={(loginPassword.length > 0 && showPassword) ? (isPurplePeeking ? 6 : -5) : isLookingAtEachOther ? 5 : undefined} eyeColor="#fff" />
                            </div>
                        </div>

                        {/* Black Character */}
                        <div
                            ref={blackRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out"
                            style={{
                                left: '280px',
                                width: '140px',
                                height: '370px',
                                backgroundColor: MATTE_BLACK,
                                borderRadius: '10px 10px 0 0',
                                zIndex: 2,
                                transform: (loginPassword.length > 0 && showPassword)
                                    ? `skewX(0deg)`
                                    : isLookingAtEachOther
                                        ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                                        : (isTyping || (loginPassword.length > 0 && !showPassword))
                                            ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                                            : `skewX(${blackPos.bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            <div
                                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                                style={{
                                    left: (loginPassword.length > 0 && showPassword) ? `${12}px` : isLookingAtEachOther ? `${38}px` : `${30 + blackPos.faceX}px`,
                                    top: (loginPassword.length > 0 && showPassword) ? `${32}px` : isLookingAtEachOther ? `${15}px` : `${38 + blackPos.faceY}px`,
                                }}
                            >
                                <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={isBlackBlinking} mouseX={mouseX} mouseY={mouseY} forceLookX={(loginPassword.length > 0 && showPassword) ? -5 : isLookingAtEachOther ? 0 : undefined} forceLookY={(loginPassword.length > 0 && showPassword) ? -5 : isLookingAtEachOther ? -5 : undefined} eyeColor="#fff" />
                                <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={isBlackBlinking} mouseX={mouseX} mouseY={mouseY} forceLookX={(loginPassword.length > 0 && showPassword) ? -5 : isLookingAtEachOther ? 0 : undefined} forceLookY={(loginPassword.length > 0 && showPassword) ? -5 : isLookingAtEachOther ? -5 : undefined} eyeColor="#fff" />
                            </div>
                        </div>

                        {/* Orange Character */}
                        <div
                            ref={orangeRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out"
                            style={{
                                left: '0px',
                                width: '280px',
                                height: '240px',
                                zIndex: 3,
                                backgroundColor: MATTE_ORANGE,
                                borderRadius: '140px 140px 0 0',
                                transform: (loginPassword.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            <div
                                className="absolute flex gap-10 transition-all duration-200 ease-out"
                                style={{
                                    left: (loginPassword.length > 0 && showPassword) ? `${60}px` : `${95 + (orangePos.faceX || 0)}px`,
                                    top: (loginPassword.length > 0 && showPassword) ? `${95}px` : `${105 + (orangePos.faceY || 0)}px`,
                                }}
                            >
                                <Pupil size={14} maxDistance={6} mouseX={mouseX} mouseY={mouseY} forceLookX={(loginPassword.length > 0 && showPassword) ? -6 : undefined} forceLookY={(loginPassword.length > 0 && showPassword) ? -5 : undefined} pupilColor="#fff" />
                                <Pupil size={14} maxDistance={6} mouseX={mouseX} mouseY={mouseY} forceLookX={(loginPassword.length > 0 && showPassword) ? -6 : undefined} forceLookY={(loginPassword.length > 0 && showPassword) ? -5 : undefined} pupilColor="#fff" />
                            </div>
                        </div>

                        {/* Yellow Character */}
                        <div
                            ref={yellowRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out"
                            style={{
                                left: '360px',
                                width: '160px',
                                height: '270px',
                                backgroundColor: MATTE_YELLOW,
                                borderRadius: '80px 80px 0 0',
                                zIndex: 4,
                                transform: (loginPassword.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${calculatePosition(yellowRef).bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            <div
                                className="absolute flex gap-8 transition-all duration-200 ease-out"
                                style={{
                                    left: (loginPassword.length > 0 && showPassword) ? `${25}px` : `${60 + (calculatePosition(yellowRef).faceX || 0)}px`,
                                    top: (loginPassword.length > 0 && showPassword) ? `${40}px` : `${50 + (calculatePosition(yellowRef).faceY || 0)}px`,
                                }}
                            >
                                <Pupil size={14} maxDistance={6} mouseX={mouseX} mouseY={mouseY} forceLookX={(loginPassword.length > 0 && showPassword) ? -6 : undefined} forceLookY={(loginPassword.length > 0 && showPassword) ? -5 : undefined} pupilColor="#fff" />
                                <Pupil size={14} maxDistance={6} mouseX={mouseX} mouseY={mouseY} forceLookX={(loginPassword.length > 0 && showPassword) ? -6 : undefined} forceLookY={(loginPassword.length > 0 && showPassword) ? -5 : undefined} pupilColor="#fff" />
                            </div>
                            <div
                                className="absolute w-24 h-[5px] bg-[#fff] rounded-full transition-all duration-200 ease-out"
                                style={{
                                    left: (loginPassword.length > 0 && showPassword) ? `${15}px` : `${45 + (calculatePosition(yellowRef).faceX || 0)}px`,
                                    top: (loginPassword.length > 0 && showPassword) ? `${105}px` : `${105 + (calculatePosition(yellowRef).faceY || 0)}px`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Login Section - DEEP MATTE BLACK */}
            <div className="flex items-center justify-center p-8 bg-[#0a0a0a] order-1 lg:order-2">
                <div className="w-full max-w-[420px]">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-6 mb-8">
                            <img src="/univ-logo.png" alt="University Logo" className="h-14 w-auto object-contain" />
                            <span className="text-zinc-600 font-light text-xl">×</span>
                            <img src="/enexus-white-logo.png" alt="E-Nexus Logo" className="h-20 w-auto object-contain" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-3 text-white leading-tight">
                            Tech Sprint Boot Camp on GEN AI for All Domains
                        </h1>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Authorized Access Only</p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Identity Gateway</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="Registered College Email ID"
                                value={username}
                                autoComplete="off"
                                onChange={onUsernameChange}
                                onFocus={() => setIsTyping(true)}
                                onBlur={() => setIsTyping(false)}
                                required
                                className="h-14 bg-white/[0.03] border-white/5 text-white placeholder:text-zinc-700 focus:border-[#f05423]/50 focus:ring-[#f05423]/05 transition-all duration-300 rounded-2xl font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Security Key</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Registration Number"
                                    value={loginPassword}
                                    onChange={onPasswordChange}
                                    required
                                    className="h-14 pr-12 bg-white/[0.03] border-white/5 text-white placeholder:text-zinc-700 focus:border-[#f05423]/50 focus:ring-[#f05423]/05 transition-all duration-300 rounded-2xl font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-[#f05423] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                        </div>

                        {loginError && (
                            <div className="p-5 text-[10px] font-bold text-red-400 bg-red-500/05 border border-red-500/10 rounded-2xl animate-in fade-in slide-in-from-top-2 flex items-center gap-3">
                                <div className="size-1.5 rounded-full bg-red-400" />
                                {loginError}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-15 rounded-[1.25rem] text-xs font-black uppercase tracking-[0.3em] bg-gradient-to-r from-[#f05423] to-[#ff9d00] text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-2xl shadow-[#f05423]/20 border-none mt-6 group"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Syncing...</span>
                                </div>
                            ) : (
                                <span className="group-hover:tracking-[0.4em] transition-all">Log in</span>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export const AnimatedLoginPage = LoginPage;
