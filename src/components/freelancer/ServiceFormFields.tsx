import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { ServiceFormData } from '@/hooks/useServiceForm';

interface TextFieldProps {
  id: keyof ServiceFormData;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  register: UseFormRegister<ServiceFormData>;
  errors: FieldErrors<ServiceFormData>;
}

export const TextField = ({ 
  id, 
  label, 
  required = false, 
  placeholder,
  type = "text", 
  register, 
  errors,
}: TextFieldProps) => (
  <div>
    <Label htmlFor={id.toString()}>{label}{required && ' *'}</Label>
    <Input
      id={id.toString()}
      type={type}
      {...register(id, { required: required ? `${label} is required` : false })}
      placeholder={placeholder}
      className={errors[id] ? "border-red-500" : ""}
    />
    {errors[id] && (
      <p className="text-red-500 text-xs mt-1">{errors[id]?.message?.toString()}</p>
    )}
  </div>
);

interface TextareaFieldProps {
  id: keyof ServiceFormData;
  label: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  register: UseFormRegister<ServiceFormData>;
  errors: FieldErrors<ServiceFormData>;
}

export const TextareaField = ({ 
  id, 
  label,
  required = false,
  placeholder, 
  rows = 3,
  register,
  errors
}: TextareaFieldProps) => (
  <div>
    <Label htmlFor={id.toString()}>{label}{required && ' *'}</Label>
    <Textarea
      id={id.toString()}
      {...register(id, { required: required ? `${label} is required` : false })}
      placeholder={placeholder}
      rows={rows}
      className={errors[id] ? "border-red-500" : ""}
    />
    {errors[id] && (
      <p className="text-red-500 text-xs mt-1">{errors[id]?.message?.toString()}</p>
    )}
  </div>
);

interface PriceFieldProps {
  id: keyof ServiceFormData;
  label: string;
  required?: boolean;
  register: UseFormRegister<ServiceFormData>;
  errors: FieldErrors<ServiceFormData>;
}

export const PriceField = ({ 
  id,
  label,
  required = false,
  register, 
  errors
}: PriceFieldProps) => (
  <div>
    <Label htmlFor={id.toString()}>{label}{required && ' *'}</Label>
    <Input
      id={id.toString()}
      type="number"
      step="0.01"
      min="0"
      {...register(id, { 
        required: required ? `${label} is required` : false,
        min: { value: 0, message: "Price must be positive" },
        valueAsNumber: true
      })}
      placeholder="100000"
      className={errors[id] ? "border-red-500" : ""}
    />
    {errors[id] && (
      <p className="text-red-500 text-xs mt-1">{errors[id]?.message?.toString()}</p>
    )}
  </div>
);

interface CategoryFieldProps {
  id: keyof ServiceFormData;
  label: string;
  categories: string[];
  required?: boolean;
  register: UseFormRegister<ServiceFormData>;
  errors: FieldErrors<ServiceFormData>;
  defaultValue?: string;
  handleCategoryChange: (value: string) => void;
}

export const CategoryField = ({ 
  id,
  label,
  categories, 
  required = false,
  register,
  errors,
  defaultValue, 
  handleCategoryChange 
}: CategoryFieldProps) => (
  <div>
    <Label htmlFor={id.toString()}>{label}{required && ' *'}</Label>
    <Select 
      onValueChange={handleCategoryChange} 
      defaultValue={defaultValue}
    >
      <SelectTrigger className={`w-full ${errors[id] ? "border-red-500" : ""}`}>
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category: string) => (
          <SelectItem key={category} value={category}>{category}</SelectItem>
        ))}
      </SelectContent>
    </Select>
    {errors[id] && (
      <p className="text-red-500 text-xs mt-1">{errors[id]?.message?.toString()}</p>
    )}
    {/* Hidden input for react-hook-form to register the field */}
    <input
      type="hidden"
      {...register(id, { required: required ? `${label} is required` : false })}
    />
  </div>
); 