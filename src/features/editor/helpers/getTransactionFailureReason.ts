type LensOperationResult = {
  __typename: string;
  reason?: string;
};

export const getTransactionFailureReason = (
  result: LensOperationResult,
): string | null =>
  result.__typename === 'TransactionWillFail'
    ? (result.reason ?? 'The transaction could not be completed.')
    : null;
