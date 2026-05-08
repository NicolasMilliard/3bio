import { creatorImages } from '@/assets/carousel/creators';
import { cn } from '@/lib/utils';
import Autoplay from 'embla-carousel-autoplay';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  Image,
} from '@/components/ui';

const creators: string[] = [
  'stani',
  'paris',
  'nilesh',
  'aoifeodwyer',
  'punkess',
  'zosphotos',
  'elliepritts',
  'nader',
];

export const CarouselCreators = () => {
  return (
    <div className="relative">
      <Carousel
        opts={{ loop: true, align: 'start', dragFree: true }}
        plugins={[Autoplay({ delay: 2500 })]}
        className="mx-auto max-w-screen"
      >
        <CarouselContent>
          {creators.map((creator) => (
            <CarouselItem
              key={creator}
              className="basis-[60vw] sm:basis-[42%] md:basis-[30%] lg:basis-[23%]"
            >
              <a
                href={`/${creator}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block focus:outline-none"
              >
                <Image
                  src={creatorImages[creator]}
                  alt={creator}
                  className={cn(
                    'h-96 w-full rounded-[192px] object-cover',
                    'transition-all duration-500 ease-out',
                    'group-hover:rounded-4xl',
                  )}
                  width={247}
                  height={384}
                  showSkeleton={true}
                  skeletonClassName="rounded-[192px]"
                />
                <div
                  className={cn(
                    'absolute inset-0 flex flex-col items-center justify-center',
                    'from-primary/80 via-primary/50 rounded-[192px] bg-linear-to-t to-transparent opacity-0',
                    'transition-all duration-500 ease-out',
                    'group-hover:rounded-4xl group-hover:opacity-100',
                  )}
                >
                  <div className="flex translate-y-2 flex-col items-center justify-center opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="text-card text-xl font-semibold">
                      lens/{creator}
                    </span>
                    <span className="text-muted">View profile</span>
                  </div>
                </div>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="from-background pointer-events-none absolute top-0 right-0 h-full w-16 bg-linear-to-l" />
    </div>
  );
};
