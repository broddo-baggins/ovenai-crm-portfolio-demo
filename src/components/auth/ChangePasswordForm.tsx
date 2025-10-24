import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Key, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const ChangePasswordForm: React.FC = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    
    try {
      // First, verify current password by trying to sign in with it
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      // Try to sign in with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.user.email!,
        password: data.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success("Password changed successfully!", {
        description: "Your password has been updated securely.",
        icon: <CheckCircle className="h-4 w-4" />,
      });

      // Reset form
      form.reset();

    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error("Failed to change password", {
        description: error.message || "Please try again or contact support.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordInput = ({ 
    field, 
    label, 
    placeholder, 
    showPassword, 
    toggleShow 
  }: {
    field: any;
    label: string;
    placeholder: string;
    showPassword: boolean;
    toggleShow: () => void;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          {...field}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          className="pr-10"
          disabled={isLoading}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={toggleShow}
          disabled={isLoading}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-400" />
          ) : (
            <Eye className="h-4 w-4 text-gray-400" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="max-w-md">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">
                Update Password
              </span>
            </div>

            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <PasswordInput
                    field={field}
                    label="Current Password"
                    placeholder="Enter current password"
                    showPassword={showCurrentPassword}
                    toggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <PasswordInput
                    field={field}
                    label="New Password"
                    placeholder="Enter new password (min 6 characters)"
                    showPassword={showNewPassword}
                    toggleShow={() => setShowNewPassword(!showNewPassword)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <PasswordInput
                    field={field}
                    label="Confirm New Password"
                    placeholder="Confirm new password"
                    showPassword={showConfirmPassword}
                    toggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Changing Password..." : "Change Password"}
              </Button>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              IDEA <strong>Tip:</strong> Use the command line tools for admin password resets:<br />
              <code className="text-xs bg-gray-100 px-1 rounded">
                node scripts/ceo-tools/reset-user-password.cjs email newPassword
              </code>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}; 