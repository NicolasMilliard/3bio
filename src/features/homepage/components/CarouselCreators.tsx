import { creatorImages } from '@/assets/carousel/creators';
import { cn } from '@/lib/utils';
import Autoplay from 'embla-carousel-autoplay';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  Mask,
  type Shape,
} from '@/components/ui';

type Item = {
  lensHandle: string;
  shapeType: Shape['type'];
  className?: string;
  width?: 'normal' | 'wide';
};

const items: Item[] = [
  { lensHandle: 'nilesh', shapeType: 'rect', className: 'rounded-4xl' },
  {
    lensHandle: 'stani',
    shapeType: 'rect',
    className: 'rounded-lg',
    width: 'wide',
  },
  { lensHandle: 'paris', shapeType: 'oval' },
  {
    lensHandle: 'aoifeodwyer',
    shapeType: 'rect',
    className: 'rounded-lg',
    width: 'wide',
  },
  { lensHandle: 'punkess', shapeType: 'rect', className: 'rounded-4xl' },
  {
    lensHandle: 'zosphotos',
    shapeType: 'rect',
    className: 'rounded-lg',
    width: 'wide',
  },
  { lensHandle: 'elliepritts', shapeType: 'oval' },
  {
    lensHandle: 'nader',
    shapeType: 'rect',
    className: 'rounded-lg',
    width: 'wide',
  },
];

export const CarouselCreators = () => {
  return (
    <div className="relative">
      <Carousel
        opts={{ loop: true, align: 'start', dragFree: true }}
        plugins={[Autoplay({ delay: 2500, stopOnInteraction: true })]}
        className="mx-auto max-w-6xl"
      >
        <CarouselContent className="-ml-6 md:-ml-14">
          {items.map((item) => (
            <CarouselItem
              key={item.lensHandle}
              className={cn(
                'pl-6 md:pl-14',
                item.width === 'wide'
                  ? 'basis-[45%] md:basis-[35%]'
                  : 'basis-1/2 md:basis-1/3 lg:basis-1/4',
              )}
            >
              <a
                href={`/${item.lensHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group block focus:outline-none"
              >
                <Mask
                  shape={{ type: item.shapeType, orientation: 'portrait' }}
                  className={cn(
                    'h-96 w-full transition-transform duration-300 ease-out',
                    'group-hover:scale-[1.02]',
                    item.className,
                  )}
                >
                  <img
                    src={creatorImages[item.lensHandle]}
                    alt={item.lensHandle}
                    loading="lazy"
                    decoding="async"
                    className={cn(
                      'h-full w-full object-cover',
                      'transition-transform duration-500 ease-out',
                      'group-hover:scale-105',
                    )}
                  />
                </Mask>
              </a>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="from-background pointer-events-none absolute top-0 right-0 h-full w-16 bg-gradient-to-l" />
    </div>
  );
};
