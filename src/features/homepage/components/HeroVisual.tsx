import { GithubIcon, InstagramIcon, YouTubeIcon } from '@/components/icons';
import { ExternalLink, Link2, ShieldCheck, Sparkles } from 'lucide-react';

const PROFILE_LINKS = [
  'Explore my latest drop',
  'See what I am building',
  'Join the conversation',
];

export const HeroVisual = () => {
  return (
    <div
      aria-hidden="true"
      data-hero-visual
      className="mx-auto w-full max-w-136 animate-[blurFadeIn_0.8s_ease-out_0.45s_forwards] opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 lg:mx-0 lg:justify-self-end"
    >
      <div className="bg-primary relative isolate h-[clamp(25rem,122vw,37rem)] overflow-hidden rounded-[2.5rem] sm:aspect-10/11 sm:h-auto sm:rounded-[3rem]">
        <div
          data-hero-layer="orbit"
          className="border-primary-foreground/25 pointer-events-none absolute -top-[10%] -right-[18%] size-[74%] rounded-full border-[2.75rem] sm:border-[3.5rem]"
        />
        <div
          data-hero-layer="connector"
          className="border-primary-foreground/35 pointer-events-none absolute top-[15%] right-[8%] size-[62%] rounded-full border border-dashed"
        />
        <span
          data-hero-layer="wordmark"
          className="text-accent/10 pointer-events-none absolute -right-[3%] -bottom-[7%] text-[6rem] leading-none font-black tracking-[-0.09em] select-none sm:text-[8.5rem]"
        >
          YOURS
        </span>

        <div className="absolute inset-0 grid grid-cols-[3.5rem_minmax(0,1fr)] sm:grid-cols-[4.75rem_minmax(0,1fr)]">
          <div
            data-hero-layer="rail"
            className="bg-accent text-accent-foreground flex flex-col items-center justify-between py-6 sm:py-8"
          >
            <span className="rotate-180 text-[0.58rem] font-black tracking-[0.28em] whitespace-nowrap [writing-mode:vertical-rl] sm:text-[0.65rem]">
              YOUR PROFILE / YOUR RULES
            </span>
            <Sparkles className="size-5 sm:size-6" strokeWidth={2.5} />
          </div>

          <div className="relative flex min-w-0 items-center justify-center px-3 py-5 sm:px-6 sm:py-8">
            <div
              data-hero-layer="status"
              className="bg-primary-foreground text-primary absolute top-[5%] left-[5%] z-30 hidden items-center gap-2 rounded-full px-4 py-2 text-[0.65rem] font-black tracking-[0.15em] uppercase shadow-[0_0.8rem_2rem_rgba(4,2,59,0.16)] sm:flex"
            >
              <span className="bg-accent size-2 rounded-full" />
              Live on Lens
            </div>

            <div
              data-hero-layer="stamp"
              className="border-accent text-accent absolute top-[6%] right-[4%] z-30 hidden rotate-6 rounded-full border-2 px-4 py-2 text-center text-[0.56rem] leading-3 font-black tracking-[0.14em] uppercase sm:block"
            >
              Creator
              <br />
              owned
            </div>

            <div
              data-hero-layer="profile"
              className="relative z-20 w-[84%] max-w-84"
            >
              <div
                data-theme="classic"
                className="bg-primary-foreground -rotate-1 rounded-[1.75rem] p-3 shadow-[0_2rem_4.5rem_rgba(4,2,59,0.34)] sm:rounded-[2.25rem] sm:p-5"
              >
                <div data-hero-layer="identity" className="px-1 sm:px-2">
                  <div className="bg-avatar-background text-avatar-foreground flex size-12 items-center justify-center rounded-full text-lg font-black sm:size-16 sm:text-2xl">
                    M
                  </div>

                  <p className="text-name-text mt-3 truncate text-sm leading-tight font-black sm:mt-4 sm:text-lg">
                    Mira Vale
                  </p>

                  <p className="text-bio-text mt-2 text-[0.65rem] leading-4 font-medium sm:text-xs sm:leading-5">
                    Digital artist building the open social web, one experiment
                    at a time.
                  </p>

                  <div
                    data-hero-layer="socials"
                    className="text-icons mt-2 -ml-1 flex items-center sm:mt-3"
                  >
                    {[
                      { label: 'Instagram', Icon: InstagramIcon },
                      { label: 'GitHub', Icon: GithubIcon },
                      { label: 'YouTube', Icon: YouTubeIcon },
                    ].map(({ label, Icon }) => (
                      <span
                        key={label}
                        className="flex size-7 items-center justify-center rounded-full sm:size-9"
                      >
                        <Icon aria-hidden="true" className="size-4 sm:size-5" />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="profile-links-canvas bg-content-background relative isolate mt-3 overflow-hidden rounded-[1.25rem] p-2 sm:mt-4 sm:rounded-3xl sm:p-3">
                  <div className="relative z-10 space-y-2">
                    {PROFILE_LINKS.map((label, index) => (
                      <div
                        key={label}
                        data-hero-layer={`link-${index + 1}`}
                        className="bg-links-background text-links-text flex items-center gap-2 rounded-xl p-1.5 sm:gap-3 sm:rounded-2xl sm:p-2"
                      >
                        <span className="bg-links-icon-background text-links-icon flex size-6 shrink-0 items-center justify-center rounded-full sm:size-7">
                          <Link2 className="size-3.5 sm:size-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[0.58rem] font-bold sm:text-[0.68rem]">
                          {label}
                        </span>
                        <span className="bg-links-icon-background text-links-icon flex size-6 shrink-0 items-center justify-center rounded-full sm:size-7">
                          <ExternalLink className="size-3.5 sm:size-4" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-branding-text mt-2 px-1 text-[0.5rem] sm:mt-3 sm:px-2 sm:text-[0.58rem]">
                  Powered by <span className="font-bold underline">3bio</span> ·
                  built on Lens
                </p>
              </div>
            </div>

            <div
              data-hero-layer="ownership"
              className="bg-accent text-accent-foreground absolute right-[4%] bottom-[5%] z-30 hidden items-center gap-2 rounded-full px-4 py-2 text-[0.62rem] font-black tracking-[0.13em] uppercase shadow-[0_0.8rem_2rem_rgba(4,2,59,0.18)] sm:flex"
            >
              <ShieldCheck className="size-3.5 sm:size-4" strokeWidth={2.5} />
              Yours to shape
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
