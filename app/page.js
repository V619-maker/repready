<!DOCTYPE html>
<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>RepReady Simulation Command Center</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary-container": "#00f0ff",
                        "error-container": "#93000a",
                        "error": "#ffb4ab",
                        "surface-container-highest": "#353535",
                        "on-surface-variant": "#b9cacb",
                        "on-primary": "#00363a",
                        "secondary-container": "#ffdb3c",
                        "on-secondary-container": "#725f00",
                    },
                    fontFamily: {
                        "headline": ["Space Grotesk"],
                        "body": ["Inter"],
                        "mono": ["JetBrains Mono"]
                    }
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glow-primary {
            box-shadow: 0 0 15px rgba(0, 240, 255, 0.3);
        }
        .glow-error {
            box-shadow: 0 0 15px rgba(255, 180, 171, 0.2);
        }
        body {
            background-color: #000000;
            color: #e2e2e2;
        }
        .glass-panel {
            background: rgba(14, 14, 14, 0.6);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .scanline {
            width: 100%;
            height: 1px;
            background: #00F0FF;
            position: absolute;
            top: 0;
            left: 0;
            opacity: 0.5;
            box-shadow: 0 0 8px #00F0FF;
        }

        /* --- INJECTED AUDIO VISUALIZER ANIMATIONS --- */
        @keyframes cyber-pulse {
            0%, 100% { height: 20%; }
            50% { height: 100%; }
        }
        .cyber-bar-1 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0s; }
        .cyber-bar-2 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.15s; }
        .cyber-bar-3 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.3s; }
        .cyber-bar-4 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.45s; }
        .cyber-bar-5 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.6s; }
    </style>
</head>
<body class="font-body selection:bg-primary-container/30 selection:text-primary-container">

<header class="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-black/60 backdrop-blur-3xl border-b border-white/10 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
    <div class="flex items-center gap-3">
        <div class="w-8 h-8 flex items-center justify-center bg-primary-container/10 rounded-lg border border-primary-container/30">
            <span class="material-symbols-outlined text-primary-container text-xl" style="font-variation-settings: 'FILL' 1;">deployed_code</span>
        </div>
        <span class="font-headline font-bold text-[#00F0FF] tracking-tighter text-xl">SOVEREIGN PROTOCOL</span>
    </div>
    <nav class="hidden md:flex items-center gap-8 font-headline tracking-widest uppercase text-xs">
        <a class="text-[#00F0FF] font-bold" href="#">DASHBOARD</a>
        <a class="text-[#B9CACB] hover:text-[#00F0FF] hover:bg-white/5 transition-all px-2 py-1 rounded" href="#">SIMULATOR</a>
        <a class="text-[#B9CACB] hover:text-[#00F0FF] hover:bg-white/5 transition-all px-2 py-1 rounded" href="#">ARCHIVES</a>
    </nav>
    <div class="flex items-center gap-4">
        <button class="text-[#B9CACB] hover:text-[#00F0FF] transition-colors">
            <span class="material-symbols-outlined">settings</span>
        </button>
        <div class="w-8 h-8 rounded-full border border-primary-container/50 p-0.5 overflow-hidden bg-zinc-800">
        </div>
    </div>
</header>

<aside class="fixed left-4 top-20 bottom-4 w-20 rounded-xl bg-[#0E0E0E]/80 backdrop-blur-3xl border border-white/10 shadow-2xl z-40 hidden lg:flex flex-col items-center py-8 gap-8 font-mono text-xs tracking-tighter">
    <div class="flex flex-col items-center gap-1 mb-4">
        <div class="w-2 h-2 rounded-full bg-primary-container glow-primary mb-2"></div>
        <span class="text-on-surface-variant text-[10px]">ACTIVE</span>
    </div>
    <nav class="flex flex-col gap-6 w-full items-center">
        <button class="bg-[#00F0FF]/10 text-[#00F0FF] border-r-2 border-[#00F0FF] w-full py-4 flex flex-col items-center gap-1 transition-all">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">grid_view</span>
            <span>DASH</span>
        </button>
        <button class="text-[#353535] hover:text-[#B9CACB] hover:bg-white/5 w-full py-4 flex flex-col items-center gap-1 transition-all">
            <span class="material-symbols-outlined">terminal</span>
            <span>OVER</span>
        </button>
        <button class="text-[#353535] hover:text-[#B9CACB] hover:bg-white/5 w-full py-4 flex flex-col items-center gap-1 transition-all">
            <span class="material-symbols-outlined">psychology</span>
            <span>PERS</span>
        </button>
    </nav>
    <div class="mt-auto flex flex-col items-center gap-4">
        <button class="w-10 h-10 rounded bg-primary-container/20 border border-primary-container/30 flex items-center justify-center text-primary-container hover:bg-primary-container/40 transition-colors">
            <span class="material-symbols-outlined">bolt</span>
        </button>
    </div>
</aside>

<main class="pt-24 pl-6 pr-6 lg:pl-32 lg:pr-12 pb-12 min-h-screen">
    <section class="max-w-6xl mx-auto">
        <div class="mb-12">
            <h1 class="font-headline text-4xl font-bold tracking-tight text-white mb-2 uppercase">Scenario Library</h1>
            <p class="text-on-surface-variant font-mono text-sm max-w-xl">SELECT A TARGET PERSONA TO INITIALIZE THE NEGOTIATION SIMULATION ENGINE.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <article class="glass-panel rounded-xl overflow-hidden group hover:border-primary-container/40 transition-all duration-500 relative">
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <div class="flex gap-4">
                            <div class="w-20 h-20 bg-surface-container-highest rounded border border-white/10 overflow-hidden relative">
                                <div class="w-full h-full bg-zinc-800"></div>
                                <div class="absolute inset-0 border border-primary-container/0 group-hover:border-primary-container/50 transition-all"></div>
                            </div>
                            <div>
                                <h2 class="font-headline text-xl font-bold text-white tracking-wide uppercase">Richard Vance</h2>
                                <p class="font-mono text-xs text-on-surface-variant mb-3">VP of Procurement // Global Logistics</p>
                                <div class="flex flex-wrap gap-2">
                                    <span class="px-2 py-0.5 bg-error-container/20 text-error text-[10px] font-mono border border-error/20 rounded-full">20% DISCOUNT MANDATE</span>
                                    <span class="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[10px] font-mono border border-white/5 rounded-full">HARD-LINER</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-4 mb-8">
                        <p class="text-sm text-on-surface-variant leading-relaxed">Vance is known for aggressive anchoring and "take it or leave it" ultimatums. Success requires maintaining frame control while offering tiered concessions.</p>
                        <div class="grid grid-cols-3 gap-2 py-4 border-y border-white/5">
                            <div class="text-center">
                                <p class="text-[10px] font-mono text-on-surface-variant">DIFFICULTY</p>
                                <p class="text-primary-container font-mono text-sm">LVL 08</p>
                            </div>
                            <div class="text-center">
                                <p class="text-[10px] font-mono text-on-surface-variant">SUCCESS RATE</p>
                                <p class="text-white font-mono text-sm">14.2%</p>
                            </div>
                            <div class="text-center">
                                <p class="text-[10px] font-mono text-on-surface-variant">AVG. DURATION</p>
                                <p class="text-white font-mono text-sm">12:45</p>
                            </div>
                        </div>
                    </div>
                    <button class="w-full py-4 bg-transparent border border-primary-container text-primary-container font-headline font-bold uppercase tracking-widest text-sm hover:bg-primary-container hover:text-on-primary transition-all duration-300 group-hover:glow-primary relative overflow-hidden">
                        <span>Initialize Simulation</span>
                        <div class="scanline hidden group-hover:block"></div>
                    </button>
                </div>
            </article>

            <article class="glass-panel rounded-xl overflow-hidden group hover:border-primary-container/40 transition-all duration-500 relative">
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <div class="flex gap-4">
                            <div class="w-20 h-20 bg-surface-container-highest rounded border border-white/10 overflow-hidden relative">
                                <div class="w-full h-full bg-zinc-800"></div>
                                <div class="absolute inset-0 border border-primary-container/0 group-hover:border-primary-container/50 transition-all"></div>
                            </div>
                            <div>
                                <h2 class="font-headline text-xl font-bold text-white tracking-wide uppercase">Sandra Chen</h2>
                                <p class="font-mono text-xs text-on-surface-variant mb-3">Head of IT Operations // Fintech</p>
                                <div class="flex flex-wrap gap-2">
                                    <span class="px-2 py-0.5 bg-primary-container/10 text-primary-container text-[10px] font-mono border border-primary-container/20 rounded-full">SECURITY OBSESSED</span>
                                    <span class="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-[10px] font-mono border border-white/5 rounded-full">ANALYTICAL</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-4 mb-8">
                        <p class="text-sm text-on-surface-variant leading-relaxed">Chen focuses on implementation risk and security protocols. She will drill into technical debt and service level agreements (SLAs).</p>
                        <div class="grid grid-cols-3 gap-2 py-4 border-y border-white/5">
                            <div class="text-center">
                                <p class="text-[10px] font-mono text-on-surface-variant">DIFFICULTY</p>
                                <p class="text-primary-container font-mono text-sm">LVL 06</p>
                            </div>
                            <div class="text-center">
                                <p class="text-[10px] font-mono text-on-surface-variant">SUCCESS RATE</p>
                                <p class="text-white font-mono text-sm">31.8%</p>
                            </div>
                            <div class="text-center">
                                <p class="text-[10px] font-mono text-on-surface-variant">AVG. DURATION</p>
                                <p class="text-white font-mono text-sm">18:10</p>
                            </div>
                        </div>
                    </div>
                    <button class="w-full py-4 bg-transparent border border-primary-container text-primary-container font-headline font-bold uppercase tracking-widest text-sm hover:bg-primary-container hover:text-on-primary transition-all duration-300 group-hover:glow-primary relative overflow-hidden">
                        <span>Initialize Simulation</span>
                        <div class="scanline hidden group-hover:block"></div>
                    </button>
                </div>
            </article>
        </div>
    </section>

    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/80">
        <div class="glass-panel w-full max-w-4xl rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,219,233,0.1)] border-white/20">
            <div class="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div class="flex items-center gap-4">
                    <div class="w-3 h-3 rounded-full bg-error animate-pulse glow-error"></div>
                    <h3 class="font-mono text-primary-container uppercase tracking-tighter">Richard D. // Negotiation Protocol Active</h3>
                </div>
            </div>
            
            <div class="p-8 space-y-8">
                <div class="relative h-24 flex items-center justify-center bg-[#1b1b1b] rounded-lg border border-white/5">
                    <div class="flex items-center justify-center gap-1.5 h-16 my-4 z-10">
                        <div class="w-1.5 bg-[#00F0FF] cyber-bar-1 shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
                        <div class="w-1.5 bg-[#00F0FF] cyber-bar-2 shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
                        <div class="w-1.5 bg-[#00F0FF] cyber-bar-3 shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
                        <div class="w-1.5 bg-[#00F0FF] cyber-bar-4 shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
                        <div class="w-1.5 bg-[#00F0FF] cyber-bar-5 shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
                    </div>
                    <div class="absolute top-2 right-4 font-mono text-[10px] text-primary-container/40">VOICE_RECOGNITION_ON</div>
                </div>

                <div class="glass-panel rounded-lg p-6 border-white/5">
                    <div class="flex gap-4">
                        <div class="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center">
                            <span class="material-symbols-outlined text-xs text-on-surface-variant">person</span>
                        </div>
                        <div class="flex-1">
                            <p class="font-mono text-sm text-on-surface-variant italic mb-1">Incoming Audio...</p>
                            <p class="font-mono text-white text-lg leading-relaxed">"Look, I understand the feature set you're pitching, but frankly, my budget was locked in Q4. If we can't see a significant reduction in the seat cost, I'm not sure there's much more to talk about today."</p>
                        </div>
                    </div>
                </div>

                <div class="relative">
                    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-primary-container">
                        <span class="material-symbols-outlined">mic</span>
                    </div>
                    <input class="w-full bg-black/40 border-0 border-b border-white/10 focus:ring-0 focus:border-primary-container py-4 pl-12 pr-4 font-mono text-sm placeholder:text-surface-container-highest text-white" placeholder="Respond with Voice or Text..." type="text"/>
                </div>
            </div>
            
            <div class="px-8 py-6 bg-white/5 border-t border-white/10 flex justify-center items-center">
                <button class="px-8 py-3 border border-error text-error text-sm font-headline font-bold uppercase tracking-widest hover:bg-error-container/20 hover:glow-error transition-all">
                    END SIMULATION
                </button>
            </div>
        </div>
    </div>
</main>

<div class="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
    <div class="absolute inset-0 opacity-[0.05] pointer-events-none" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 40px 40px;"></div>
</div>
</body>
</html>
