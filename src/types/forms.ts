import { FieldErrors, UseFormRegister } from 'react-hook-form';

export interface BaseFormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

export interface TextFieldProps extends BaseFormFieldProps {
  register?: UseFormRegister<any>;
  errors?: FieldErrors<any>;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

export interface TextareaFieldProps extends BaseFormFieldProps {
  register?: UseFormRegister<any>;
  rows?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export interface NumberFieldProps extends BaseFormFieldProps {
  register?: UseFormRegister<any>;
  errors?: FieldErrors<any>;
  min?: number;
  max?: number;
  validationRules?: Record<string, any>;
  value?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface PriceFieldProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  formattedPrice: string;
}

export interface CategoryFieldProps {
  categories: string[];
  defaultValue?: string;
  handleCategoryChange: (value: string) => void;
}

export interface CategoryIdFieldProps {
  categories: {id: string, name: string}[];
  defaultValue?: string;
  handleCategoryChange: (value: string) => void;
}

export interface AvailabilityToggleProps {
  isAvailable: boolean;
  setIsAvailable: (value: boolean) => void;
  label?: string;
} 