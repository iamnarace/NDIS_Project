'use client';
import { createContext, useContext } from 'react';

export const FieldContext = createContext<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>({});
export const useFieldControl = () => useContext(FieldContext);
