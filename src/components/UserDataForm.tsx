import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, FileText } from 'lucide-react';

// Função para validar CPF
const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // Rejeita sequências iguais

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cleaned.charAt(10));
};

// Função para validar CNPJ
const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false; // Rejeita sequências iguais

  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  let digit = remainder < 2 ? 0 : 11 - remainder;
  if (digit !== parseInt(cleaned.charAt(12))) return false;

  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  remainder = sum % 11;
  digit = remainder < 2 ? 0 : 11 - remainder;
  return digit === parseInt(cleaned.charAt(13));
};

const userDataSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido').refine((val) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return validateCPF(cleaned);
    } else if (cleaned.length === 14) {
      return validateCNPJ(cleaned);
    }
    return false;
  }, 'CPF ou CNPJ inválido')
});

type UserDataForm = z.infer<typeof userDataSchema>;

interface UserDataFormProps {
  onSubmit: (data: UserDataForm) => void;
  loading?: boolean;
  initialData?: Partial<UserDataForm>;
}

export function UserDataForm({ onSubmit, loading = false, initialData }: UserDataFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm<UserDataForm>({
    resolver: zodResolver(userDataSchema),
    defaultValues: initialData,
    mode: 'onChange'
  });

  const watchedCpfCnpj = watch('cpfCnpj');
  const isCpfCnpjValid = watchedCpfCnpj ? (() => {
    const cleaned = watchedCpfCnpj.replace(/\D/g, '');
    if (cleaned.length === 11) return validateCPF(cleaned);
    if (cleaned.length === 14) return validateCNPJ(cleaned);
    return false;
  })() : false;

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    if (cleaned.length >= 2) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  const formatCpfCnpj = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      // CPF: XXX.XXX.XXX-XX
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
      if (match) {
        return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
      }
      if (cleaned.length > 6) {
        return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
      }
      if (cleaned.length > 3) {
        return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
      }
      return cleaned;
    } else {
      // CNPJ: XX.XXX.XXX/XXXX-XX
      const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
      if (match) {
        return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
      }
      if (cleaned.length > 8) {
        return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
      }
      if (cleaned.length > 5) {
        return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
      }
      if (cleaned.length > 2) {
        return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
      }
      return cleaned;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Dados Pessoais
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Precisamos dessas informações para processar seu pagamento
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome Completo
            </Label>
            <Input
              id="name"
              placeholder="Seu nome completo"
              {...register('name')}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone
            </Label>
            <Input
              id="phone"
              placeholder="(11) 99999-9999"
              {...register('phone')}
              disabled={loading}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setValue('phone', formatted);
              }}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpfCnpj" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              CPF ou CNPJ
              {isCpfCnpjValid && watchedCpfCnpj.replace(/\D/g, '').length >= 11 && (
                <span className="text-green-600 text-sm">✓ Válido</span>
              )}
            </Label>
            <Input
              id="cpfCnpj"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              {...register('cpfCnpj')}
              disabled={loading}
              className={isCpfCnpjValid && watchedCpfCnpj.replace(/\D/g, '').length >= 11 ? 'border-green-500' : ''}
              onChange={(e) => {
                const formatted = formatCpfCnpj(e.target.value);
                setValue('cpfCnpj', formatted, { shouldValidate: true });
              }}
            />
            {errors.cpfCnpj && (
              <p className="text-sm text-destructive">{errors.cpfCnpj.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading || !isValid}>
            {loading ? 'Validando...' : 'Continuar para Pagamento'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}