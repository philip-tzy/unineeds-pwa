
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';

// Text Field Component
export const TextField = ({ 
  id, 
  label, 
  required = false, 
  placeholder, 
  register, 
  errors,
  ...rest 
}: any) => (
  <div>
    <Label htmlFor={id}>{label}{required && '*'}</Label>
    <Input
      id={id}
      {...register(id, { required: required ? `${label} is required` : false })}
      placeholder={placeholder}
      className={errors?.[id] ? "border-red-500" : ""}
      {...rest}
    />
    {errors?.[id] && (
      <p className="text-red-500 text-xs mt-1">{errors[id].message}</p>
    )}
  </div>
);

// Textarea Field Component
export const TextareaField = ({ 
  id, 
  label, 
  placeholder, 
  register,
  rows = 3
}: any) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Textarea
      id={id}
      {...register(id)}
      placeholder={placeholder}
      rows={rows}
    />
  </div>
);

// Price Field Component
export const PriceField = ({ 
  register, 
  errors, 
  formattedPrice 
}: any) => (
  <div>
    <Label htmlFor="price">Price ($)*</Label>
    <Input
      id="price"
      type="number"
      step="0.01"
      min="0"
      {...register('price', { 
        required: "Price is required",
        min: { value: 0, message: "Price must be positive" }
      })}
      placeholder="8.99"
      className={errors?.price ? "border-red-500" : ""}
    />
    {errors?.price ? (
      <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
    ) : (
      <p className="text-gray-500 text-xs mt-1">${formattedPrice}</p>
    )}
  </div>
);

// Number Field Component
export const NumberField = ({ 
  id, 
  label, 
  min = 0, 
  placeholder, 
  register, 
  errors,
  validationRules = {} 
}: any) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type="number"
      min={min}
      {...register(id, validationRules)}
      placeholder={placeholder}
      className={errors?.[id] ? "border-red-500" : ""}
    />
    {errors?.[id] && (
      <p className="text-red-500 text-xs mt-1">{errors[id].message}</p>
    )}
  </div>
);

// Category Field Component
export const CategoryField = ({ 
  categories, 
  defaultValue, 
  handleCategoryChange 
}: any) => (
  <div>
    <Label htmlFor="category">Category</Label>
    <Select 
      onValueChange={handleCategoryChange} 
      defaultValue={defaultValue}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category: string) => (
          <SelectItem key={category} value={category}>{category}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

// Category ID Field Component
export const CategoryIdField = ({ 
  categories, 
  defaultValue, 
  handleCategoryChange 
}: any) => (
  <div>
    <Label htmlFor="category_id">Category</Label>
    <Select 
      onValueChange={handleCategoryChange} 
      defaultValue={defaultValue}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category: {id: string, name: string}) => (
          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

// Availability Toggle Component
export const AvailabilityToggle = ({ 
  isAvailable, 
  setIsAvailable,
  label = "Available for ordering"
}: any) => (
  <div className="flex items-center space-x-2">
    <Switch 
      id="is_available" 
      checked={isAvailable}
      onCheckedChange={setIsAvailable}
    />
    <Label htmlFor="is_available">{label}</Label>
  </div>
);
