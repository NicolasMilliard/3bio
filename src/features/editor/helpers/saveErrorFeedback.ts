export type SaveStage =
  | 'validating-images'
  | 'uploading-avatar'
  | 'uploading-social-image'
  | 'uploading-profile-data'
  | 'submitting-transaction'
  | 'confirming-transaction';

type SaveErrorFeedback = {
  title: string;
  description: string;
};

export const getSaveErrorFeedback = (stage: SaveStage): SaveErrorFeedback => {
  switch (stage) {
    case 'uploading-avatar':
      return {
        title: 'Avatar upload failed',
        description:
          'Your draft is still here. Check your connection and try again.',
      };
    case 'uploading-social-image':
      return {
        title: 'Social image upload failed',
        description:
          'Your draft is still here. Check your connection and try again.',
      };
    case 'uploading-profile-data':
      return {
        title: 'Profile data upload failed',
        description:
          'Your draft is still here. Check your connection and try again.',
      };
    case 'confirming-transaction':
      return {
        title: 'Profile confirmation interrupted',
        description:
          'The transaction was submitted, but Lens could not confirm it. Check your public profile before trying again.',
      };
    case 'submitting-transaction':
      return {
        title: 'Profile update failed',
        description:
          'The wallet or Lens could not submit the update. Your draft is still here; try again.',
      };
    case 'validating-images':
      return {
        title: 'Could not check your images',
        description:
          'Your draft is still here. Choose the images again and retry.',
      };
  }
};
