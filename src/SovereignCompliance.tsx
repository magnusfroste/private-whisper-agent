import { Shield, Mic, Zap, CheckCircle, Info, ChevronRight, Gavel, Globe } from 'lucide-react';

export default function SovereignCompliance() {
    return (
        <div className="flex-1 overflow-y-auto bg-[#050505] text-white p-8 md:p-12">
            <div className="max-w-4xl mx-auto space-y-16">
                {/* Header Section */}
                <section className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium">
                        <Shield className="w-4 h-4" />
                        <span>Sovereign AI & Data Privacy</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
                        Enterprise Trust in the <br />Age of AI.
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                        Autoversio is built for organizations that cannot afford to compromise on data sovereignty.
                        We provide a complete, private infrastructure that keeps your most sensitive information
                        within your control.
                    </p>
                </section>

                {/* GDPR & EU AI Act Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-gray-800 space-y-4 hover:border-purple-500/30 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <Gavel className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-semibold">GDPR Compliant</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Zero data leakage. Our architecture ensures that voice data and transcriptions
                            never leave your sovereign boundary. No logs are sent to third parties,
                            meeting the strictest privacy requirements.
                        </p>
                    </div>
                    <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-gray-800 space-y-4 hover:border-purple-500/30 transition-all group">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-semibold">EU AI Act Ready</h3>
                        <p className="text-gray-400 leading-relaxed">
                            We provide full transparency and auditability. By hosting your own models,
                            you ensure compliance with upcoming EU regulations regarding high-risk AI
                            systems and data governance.
                        </p>
                    </div>
                </div>

                {/* Hosting Models Section */}
                <section className="space-y-10">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-bold">The Sovereignty Spectrum</h2>
                        <p className="text-gray-400">Choose the deployment model that fits your security profile.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-gray-800 space-y-4">
                            <div className="text-purple-400 font-bold text-sm tracking-widest uppercase">Layer 01</div>
                            <h4 className="text-xl font-bold">Public Cloud</h4>
                            <p className="text-sm text-gray-500 italic">Optional</p>
                            <p className="text-gray-400 text-sm">Convenience at the cost of control. Standard SaaS model.</p>
                            <div className="pt-4 border-t border-gray-900 group flex items-center gap-2 text-xs text-red-500/70 italic">
                                <span>Not Recommended for sensitive data</span>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/30 space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3">
                                <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white uppercase">Most Popular</div>
                            </div>
                            <div className="text-purple-400 font-bold text-sm tracking-widest uppercase">Layer 02</div>
                            <h4 className="text-xl font-bold">Sovereign Cloud</h4>
                            <p className="text-sm text-purple-400/70 italic">Cloud, but yours</p>
                            <p className="text-gray-400 text-sm">Isolated virtual hardware in highly secure, regional data centers (e.g., Easypanel).</p>
                            <div className="pt-4 border-t border-purple-500/10 flex items-center gap-2 text-xs text-purple-400">
                                <CheckCircle className="w-3 h-3" />
                                <span>Regional Data Privacy</span>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-[#0a0a0a] border border-gray-800 space-y-4">
                            <div className="text-purple-400 font-bold text-sm tracking-widest uppercase">Layer 03</div>
                            <h4 className="text-xl font-bold">Local Edge</h4>
                            <p className="text-sm text-green-400/70 italic">Maximum Security</p>
                            <p className="text-gray-400 text-sm">Deployment on your own physical hardware (Air-gapped compatible). No external pipes.</p>
                            <div className="pt-4 border-t border-gray-900 flex items-center gap-2 text-xs text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                <span>100% Data Sovereignty</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pipeline Illustration Section */}
                <section className="space-y-12">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold">Technical Pipelines</h2>
                        <p className="text-gray-400 text-sm">How your data is processed.</p>
                    </div>

                    <div className="space-y-8">
                        {/* Standard Pipeline */}
                        <div className="p-8 rounded-[2.5rem] bg-[#0a0a0a] border border-gray-800 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center border border-gray-800">
                                    <Mic className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Standard Intelligence Pipeline</h4>
                                    <p className="text-xs text-gray-500">Traditional Split-Inference Model</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 py-4">
                                <div className="px-4 py-2 rounded-2xl bg-gray-900 border border-gray-800 text-sm font-medium">Audio Input</div>
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                                <div className="px-4 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-400">
                                    Whisper v3 (Local STT)
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                                <div className="px-4 py-2 rounded-2xl bg-gray-900 border border-gray-800 text-sm font-medium text-gray-400">Text Data</div>
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                                <div className="px-4 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-sm font-medium text-purple-400">
                                    LLM Intelligence
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 italic">Best for high-precision text records and structured document generation.</p>
                        </div>

                        {/* Native Pipeline */}
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0a0a0a] to-[#0f0a1a] border border-purple-500/20 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                    <Zap className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold">Native Multimodal Pipeline</h4>
                                    <p className="text-xs text-purple-400/60 font-semibold uppercase tracking-wider">Next-Gen / Low Latency</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 py-4">
                                <div className="px-4 py-2 rounded-2xl bg-gray-900 border border-gray-800 text-sm font-medium">Audio Input</div>
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                                <div className="px-6 py-4 rounded-3xl bg-purple-500/20 border border-purple-500/40 text-sm font-bold text-white shadow-[0_0_30px_-10px_rgba(168,85,247,0.4)]">
                                    Ultravox (Native Audio Weights)
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-700" />
                                <div className="px-4 py-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-sm font-medium text-purple-400">
                                    Intelligence Output
                                </div>
                            </div>
                            <p className="text-xs text-purple-400/70 italic">Zero text bottleneck. The model "hears" emotional nuances directly. Highest speed.</p>
                        </div>
                    </div>
                </section>

                {/* FAQ Section Footer */}
                <section className="pt-12 border-t border-gray-900 space-y-8">
                    <h3 className="text-2xl font-bold">Common Questions</h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h5 className="font-semibold flex items-center gap-2">
                                <Info className="w-4 h-4 text-purple-400" />
                                Where is my data stored?
                            </h5>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                By default, Autoversio stores nothing. Files are processed in volatile memory on your own
                                container instance. If you choose to enable history, it is encrypted and stored on your
                                dedicated database, never transmitted back to Autoversio central.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h5 className="font-semibold flex items-center gap-2">
                                <Info className="w-4 h-4 text-purple-400" />
                                Is this really safe for GDPR?
                            </h5>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Yes. Since you control the endpoint (your Easypanel or On-Prem server), you are the
                                Data Controller. You have 100% visibility into the logs and infrastructure.
                            </p>
                        </div>
                    </div>
                </section>

                <footer className="py-12 text-center text-gray-600 text-sm">
                    <p>© 2026 Autoversio Sovereign Intelligence. All rights reserved.</p>
                    <p className="mt-2 flex items-center justify-center gap-2">
                        <Globe className="w-3 h-3" />
                        Designed for Data Sovereignty
                    </p>
                </footer>
            </div>
        </div>
    );
}
