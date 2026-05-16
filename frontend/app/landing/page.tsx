export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface">
      {/* Top Navigation Bar */}
      <nav className="bg-surface shadow-[0px_4px_20px_rgba(31,41,55,0.08)] flex justify-between items-center px-[40px] py-[16px] w-full fixed top-0 z-50">
        <div className="flex items-center gap-[16px]">
          <span className="font-headline-md text-headline-md font-bold text-primary">
            EcosystemOS
          </span>
        </div>

        <div className="hidden md:flex items-center gap-[24px]">
          <a
            className="text-primary border-b-2 border-primary pb-1 font-semibold text-label-lg transition-colors"
            href="#"
          >
            Dashboard
          </a>
          <a
            className="text-on-surface-variant font-medium text-label-lg hover:text-primary transition-colors"
            href="#"
          >
            Matches
          </a>
          <a
            className="text-on-surface-variant font-medium text-label-lg hover:text-primary transition-colors"
            href="#"
          >
            Chat
          </a>
          <a
            className="text-on-surface-variant font-medium text-label-lg hover:text-primary transition-colors"
            href="#"
          >
            Profile
          </a>
        </div>

        <div className="flex items-center gap-[16px]">
          <div className="hidden sm:flex items-center gap-[8px] mr-[16px]">
            <span className="material-symbols-outlined text-on-surface-variant">
              notifications
            </span>
            <span className="material-symbols-outlined text-on-surface-variant">
              sparkle
            </span>
          </div>
          <button className="bg-primary-container text-on-primary rounded-lg px-[24px] py-[8px] text-label-lg active:scale-95 transition-transform duration-150 hover:opacity-90">
            Find Mentor
          </button>
        </div>
      </nav>

      <main className="pt-[64px]">
        {/* Hero Section */}
        <section className="px-[40px] py-[64px] flex flex-col items-center text-center max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-[8px] bg-surface-container-low px-[16px] py-1 rounded-full mb-[24px] border border-outline-variant">
            <span
              className="material-symbols-outlined text-primary text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              sparkle
            </span>
            <span className="text-primary text-label-sm">v2.0 Neural Engine Live</span>
          </div>

          <h1 className="text-display-lg text-on-surface mb-[16px] max-w-4xl leading-tight">
            Automate{" "}
            <span className="text-primary-container">Ecosystem Relationships.</span>
          </h1>

          <p className="text-body-lg text-on-surface-variant mb-[24px] max-w-2xl">
            Startup to Mentor matching, AI coordination, and behavior analysis in one
            unified platform for high-growth accelerators.
          </p>

          <div className="flex flex-col sm:flex-row gap-[16px]">
            <button className="bg-primary-container text-on-primary px-8 py-4 rounded-xl text-headline-sm flex items-center gap-[8px] active:scale-95 transition-transform hover:opacity-90">
              Start Demo
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button className="bg-surface border border-outline-variant text-on-surface-variant px-8 py-4 rounded-xl text-headline-sm hover:bg-surface-variant transition-colors">
              View Pricing
            </button>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="mt-[64px] w-full relative">
            <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-full"></div>
            <div className="bg-white rounded-[32px] shadow-[0px_32px_80px_rgba(31,41,55,0.12)] border border-outline-variant p-[8px] overflow-hidden">
              <img
                className="w-full h-auto rounded-[24px]"
                alt="A high-fidelity software dashboard interface with a clean light mode aesthetic"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtXySYRXaWXcyTc_sU8zOThrpBXLFgfWtBgeN93LT0DqhDyU5_FC4XQH0GhQoAGCsBF5o_iA-vJmYHXXgsUApKff8R6IdCn2D78uNXi8CMQcHrW7LhMWSBk9F9aOg4uM6xaGLENxQ2mH5HI1AMlr8a62jjdMcVpPm55oHuePwfJxYWLwAES9pDf9g_7IkeQVLvzMuiKxsyqQmyf2Sdgg8ETaHVV8dNWdKC3dZjBCxRzueaVV-MetR0SKAS46rNeorCE7ZkBdAPG-4"
              />
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="px-[40px] py-[64px] bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="mb-[64px] text-center">
              <h2 className="text-headline-lg text-on-surface">
                Built for Scaling Connections
              </h2>
              <p className="text-body-md text-on-surface-variant mt-[8px]">
                Intelligence at every touchpoint of your startup program.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-[24px]">
              {/* AI Matching Card */}
              <div className="md:col-span-8 bg-surface-container-lowest p-[24px] rounded-[24px] shadow-[0px_4px_20px_rgba(31,41,55,0.08)] flex flex-col md:flex-row gap-[24px] overflow-hidden border border-outline-variant/30">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-[16px]">
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      diversity_3
                    </span>
                  </div>
                  <h3 className="text-headline-md text-on-surface mb-[8px]">AI Matching</h3>
                  <p className="text-body-md text-on-surface-variant">
                    Our neural engine analyzes founder trajectories and mentor expertise to
                    create high-confidence connections that actually convert to growth.
                  </p>
                  <div className="mt-[24px] flex gap-[8px] flex-wrap">
                    <span className="bg-surface px-[8px] py-1 rounded-full text-label-sm border border-outline-variant">
                      NLP Analysis
                    </span>
                    <span className="bg-surface px-[8px] py-1 rounded-full text-label-sm border border-outline-variant">
                      Fit Scoring
                    </span>
                  </div>
                </div>
                <div className="flex-1 bg-surface-container rounded-xl p-[16px]">
                  <div className="flex items-center justify-between mb-[8px]">
                    <span className="text-label-lg">Top Recommendation</span>
                    <span className="text-primary font-bold">98% Match</span>
                  </div>
                  <div className="flex items-center gap-[16px] bg-white p-[8px] rounded-lg shadow-sm border border-outline-variant/20">
                    <img
                      className="w-12 h-12 rounded-full object-cover"
                      alt="A professional headshot of a mentor"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuByzxB0DucfgCwTnALUSik1o3mOGcBFEaYSNy4OPZdNjLWhS33WZXXjd9vociHY4Es64GCqSKFPvcGcinJjhfUS9irZU26bEHEz_a4_jbIgGf_FAQzfAFxOt-cGb0XZg8Zjh9JJqL0DZIAgAG7UmBYT2E_kSILFDNXBnTzwiWYQaORurOVA3TSEsAZSO8Uk7PIsh1XWMV_WY6eEScpA3ZwPFNHHkQjuj8SsQh_UzZHhitvMjMclHYHMug6ze3tcpTbf1X2m2yhK8VM"
                    />
                    <div>
                      <p className="text-label-lg">Sarah Jenkins</p>
                      <p className="text-[12px] text-on-surface-variant">
                        SaaS Scale-up Expert
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined text-primary ml-auto"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      sparkle
                    </span>
                  </div>
                </div>
              </div>

              {/* Behavior Analytics Card */}
              <div className="md:col-span-4 bg-primary-container p-[24px] rounded-[24px] shadow-[0px_4px_20px_rgba(31,41,55,0.08)] flex flex-col text-on-primary">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-[16px]">
                  <span className="material-symbols-outlined text-white">analytics</span>
                </div>
                <h3 className="text-headline-md text-on-primary mb-[8px]">
                  Behavior Analytics
                </h3>
                <p className="text-body-sm text-on-primary-container opacity-90 mb-[24px]">
                  Track engagement metrics and session sentiment to identify at-risk
                  relationships before they stall.
                </p>
                <div className="mt-auto h-24 flex items-end gap-2">
                  <div className="w-full bg-white/20 h-[40%] rounded-t-sm"></div>
                  <div className="w-full bg-white/40 h-[70%] rounded-t-sm"></div>
                  <div className="w-full bg-white/60 h-[55%] rounded-t-sm"></div>
                  <div className="w-full bg-white h-[90%] rounded-t-sm"></div>
                </div>
              </div>

              {/* 1-Click Meetings */}
              <div className="md:col-span-4 bg-surface-container-lowest p-[24px] rounded-[24px] shadow-[0px_4px_20px_rgba(31,41,55,0.08)] border border-outline-variant/30">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-[16px]">
                  <span className="material-symbols-outlined text-secondary">
                    calendar_month
                  </span>
                </div>
                <h3 className="text-headline-md text-on-surface mb-[8px]">
                  1-Click Meetings
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  Automated scheduling that respects calendars, time zones, and program
                  milestones instantly.
                </p>
              </div>

              {/* Program Oversight */}
              <div className="md:col-span-8 bg-surface-container-lowest p-[24px] rounded-[24px] shadow-[0px_4px_20px_rgba(31,41,55,0.08)] flex flex-col justify-center border border-outline-variant/30">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-[24px] text-center">
                  <div>
                    <p className="text-[32px] text-primary font-bold">12k+</p>
                    <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Matches Made
                    </p>
                  </div>
                  <div>
                    <p className="text-[32px] text-primary font-bold">85%</p>
                    <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Success Rate
                    </p>
                  </div>
                  <div>
                    <p className="text-[32px] text-primary font-bold">4.9/5</p>
                    <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Avg Rating
                    </p>
                  </div>
                  <div>
                    <p className="text-[32px] text-primary font-bold">2min</p>
                    <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Setup Time
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Trusted By */}
        <section className="py-[16px] px-[40px] border-y border-outline-variant bg-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-[24px]">
            <span className="text-label-lg text-on-surface-variant opacity-60 uppercase">
              Trusted by world-class accelerators
            </span>
            <div className="flex flex-wrap justify-center gap-[24px] grayscale opacity-50">
              <span className="text-headline-sm font-bold">Y-HUB</span>
              <span className="text-headline-sm font-bold">TECHVENTURE</span>
              <span className="text-headline-sm font-bold">NEXUS FUND</span>
              <span className="text-headline-sm font-bold">GLOBAL SCALE</span>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-[40px] py-[64px]">
          <div className="max-w-5xl mx-auto bg-inverse-surface rounded-[32px] p-[24px] md:p-[64px] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full"></div>
            <div className="relative z-10">
              <h2 className="text-headline-lg text-white mb-[16px]">
                Ready to scale your ecosystem?
              </h2>
              <p className="text-body-lg text-white/70 mb-[24px] max-w-xl mx-auto">
                Join 500+ programs using EcosystemOS to automate their mentorship and
                partnership pipelines.
              </p>
              <button className="bg-primary text-white px-10 py-5 rounded-xl text-headline-sm active:scale-95 transition-transform shadow-lg shadow-primary/25 hover:opacity-90">
                Start Your Free Trial
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Component */}
      <footer className="w-full py-[16px] px-[40px] flex flex-col md:flex-row justify-between items-center gap-[16px] bg-surface-container-lowest border-t border-outline-variant">
        <div className="flex flex-col items-center md:items-start gap-[8px]">
          <span className="text-label-lg font-bold text-on-surface">EcosystemOS</span>
          <p className="text-body-sm text-on-surface-variant">
            © 2024 EcosystemOS Intelligence. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-[24px]">
          <a
            className="text-on-surface-variant hover:text-primary transition-colors text-body-sm"
            href="#"
          >
            Privacy Policy
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors text-body-sm"
            href="#"
          >
            Terms of Service
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors text-body-sm"
            href="#"
          >
            Cookie Settings
          </a>
          <a
            className="text-on-surface-variant hover:text-primary transition-colors text-body-sm"
            href="#"
          >
            Contact Support
          </a>
        </div>
      </footer>
    </div>
  );
}
