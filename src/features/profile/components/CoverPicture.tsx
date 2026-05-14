import type { InBioProfile } from '@/schemas/inBioMetadata.schema';

export const CoverPicture = ({
  coverPicture,
}: {
  coverPicture: InBioProfile['coverPicture'] | null;
}) => {
  return (
    <>
      {coverPicture ? (
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center blur brightness-95 saturate-130"
            style={{ backgroundImage: `url(${coverPicture})` }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(var(--cover-background-dot)_1px,var(--cover-background)_1px)] bg-size-[20px_20px]" />
      )}
    </>
  );
};
