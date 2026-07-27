import { Text } from '@/components/ui';
import { Fingerprint, Globe2, ShieldCheck } from 'lucide-react';

const CREATOR_RIGHTS = [
  {
    action: 'Select',
    title: 'Your Lens profile',
    description:
      '3bio lets you choose which Lens profile to edit and only saves changes to that selected profile.',
    icon: Fingerprint,
  },
  {
    action: 'Keep',
    title: 'Your content stays yours',
    description:
      '3bio does not claim ownership of the name, bio, images, or links you publish through the editor.',
    icon: ShieldCheck,
  },
  {
    action: 'Publish',
    title: 'Public by design',
    description:
      'Saved metadata and uploads are published through Lens and Grove.',
    icon: Globe2,
  },
];

export const CreatorRightsSection = () => {
  return (
    <section
      aria-labelledby="creator-rights-title"
      className="mx-auto w-full max-w-6xl px-4"
    >
      <div className="bg-primary text-primary-foreground relative isolate overflow-hidden rounded-[2.5rem] sm:rounded-[3rem]">
        <div
          aria-hidden="true"
          className="border-accent/10 pointer-events-none absolute -top-28 -right-24 size-80 rounded-full border-52"
        />
        <span
          aria-hidden="true"
          className="text-accent/10 pointer-events-none absolute -right-6 -bottom-16 hidden text-[11rem] leading-none font-black tracking-[-0.08em] select-none sm:block lg:text-[15rem]"
        >
          YOURS
        </span>

        <div className="grid lg:grid-cols-[6.5rem_minmax(0,1fr)]">
          <div
            aria-hidden="true"
            className="bg-accent text-accent-foreground hidden flex-col items-center justify-between py-10 lg:flex"
          >
            <span className="rotate-180 text-xs font-bold tracking-[0.35em] [writing-mode:vertical-rl]">
              CREATOR RIGHTS
            </span>
            <ShieldCheck className="size-7" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 lg:p-14">
            <div className="flex items-start justify-between gap-8">
              <div className="max-w-3xl">
                <p className="text-accent mb-4 text-xs font-bold tracking-[0.22em] uppercase lg:hidden">
                  Creator rights
                </p>
                <Text
                  id="creator-rights-title"
                  variant="h2"
                  className="text-primary-foreground max-w-2xl text-4xl leading-[1.05] sm:text-5xl"
                >
                  Your profile.
                  <br />
                  Your content.
                  <br />
                  <span className="text-accent">Your call.</span>
                </Text>
                <Text className="text-primary-foreground/80 mt-5 max-w-2xl text-base leading-7 sm:text-lg">
                  3bio helps you present and update your Lens profile. It does
                  not claim ownership of your identity or creative work.
                </Text>
              </div>

              <div
                aria-hidden="true"
                className="border-accent text-accent hidden shrink-0 rotate-6 rounded-full border-2 px-5 py-3 text-center text-[0.65rem] leading-4 font-black tracking-[0.16em] uppercase sm:block"
              >
                Creator
                <br />
                owned
              </div>
            </div>

            <ol className="border-primary-foreground/20 mt-10 border-y">
              {CREATOR_RIGHTS.map(
                ({ action, title, description, icon: Icon }, index) => (
                  <li
                    key={title}
                    className="border-primary-foreground/20 grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 gap-y-2 border-t py-7 first:border-t-0 lg:grid-cols-[4rem_3rem_14rem_minmax(0,1fr)] lg:items-start lg:gap-x-6"
                  >
                    <span
                      aria-hidden="true"
                      className="text-accent col-start-1 row-start-1 text-2xl font-black tracking-tight"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="bg-accent text-accent-foreground col-start-1 row-start-2 mt-1 flex size-9 items-center justify-center rounded-full lg:col-start-2 lg:row-start-1 lg:mt-0">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <div className="col-start-2 row-start-1 lg:col-start-3">
                      <p className="text-accent text-[0.65rem] font-bold tracking-[0.18em] uppercase">
                        {action}
                      </p>
                      <h3 className="mt-1 text-lg leading-6 font-semibold">
                        {title}
                      </h3>
                    </div>
                    <p className="text-primary-foreground/80 col-start-2 row-start-2 text-sm leading-6 lg:col-start-4 lg:row-start-1">
                      {description}
                    </p>
                  </li>
                ),
              )}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
};
