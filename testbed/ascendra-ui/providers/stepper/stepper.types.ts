export type StepperStep = {
  label: string;
  description?: string;
  onNext?: () => Promise<boolean>;
};

export type StepperContextValue = {
  steps: StepperStep[];
  currentStep: number;
  goToStep: (i: number) => void;
  handleNext: () => Promise<void>;
  handlePrevious: () => void;
  isSubmitting: boolean;
};

export type StepperProviderProps = {
  steps: StepperStep[];
  onSubmit: () => Promise<boolean>;
  children: React.ReactNode;
};
