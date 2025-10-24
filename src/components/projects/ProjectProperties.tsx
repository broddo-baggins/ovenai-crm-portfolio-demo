import React from "react";
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  MapPin,
  User,
  Clock,
  Tag,
  Building,
  DollarSign,
  Users,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: "active" | "inactive" | "completed" | "on-hold" | "archived";
  budget?: number;
  location?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  lead_count?: number;
  completion_percentage?: number;
  manager?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  notes?: string;
  client_id?: string;
  metadata?: Record<string, any>;
  updated_at?: string;
}

interface ProjectPropertiesProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onCall?: (phone: string) => void;
  onEmail?: (email: string) => void;
  onMessage?: (projectId: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "completed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "on-hold":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "inactive":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const ProjectProperties: React.FC<ProjectPropertiesProps> = ({
  project,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onCall,
  onEmail,
  onMessage,
}) => {
  const { t } = useTranslation(["common", "projects"]);
  const { isRTL, textStart, flexRowReverse } = useLang();

  if (!isOpen || !project) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return t("projects.notAvailable", "N/A");
    return new Date(dateString).toLocaleDateString(isRTL ? "he-IL" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return t("projects.notAvailable", "N/A");
    return new Intl.NumberFormat(isRTL ? "he-IL" : "en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 z-50 bg-background shadow-xl transition-transform duration-300 ease-in-out",
        "w-full sm:w-96 overflow-y-auto",
        isRTL ? "left-0" : "right-0",
        isOpen
          ? "translate-x-0"
          : isRTL
            ? "-translate-x-full"
            : "translate-x-full",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between p-4 border-b",
          isRTL && "flex-row-reverse",
        )}
      >
        <div
          className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Building className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className={cn(isRTL && "text-right")}>
            <h2 className="text-lg font-semibold">{project.name}</h2>
            <p className="text-sm text-muted-foreground">
              {project.client_name || t("projects.project", "Project")}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Status and Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-base", textStart())}>
              {t("projects.statusProgress", "Status & Progress")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse",
              )}
            >
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{t("projects.status", "Status")}:</span>
              <Badge className={getStatusColor(project.status)}>
                {t(`projects.status.${project.status}`, project.status)}
              </Badge>
            </div>
            {project.completion_percentage !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse",
                )}
              >
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("projects.completion", "Completion")}:
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.completion_percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {project.completion_percentage}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-base", textStart())}>
              {t("projects.details", "Project Details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Budget */}
            {project.budget && (
              <div
                className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse",
                )}
              >
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("projects.budget", "Budget")}:
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(project.budget)}
                </span>
              </div>
            )}

            {/* Lead Count */}
            {project.lead_count !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse",
                )}
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{t("projects.leads", "Leads")}:</span>
                <Badge variant="secondary">{project.lead_count}</Badge>
              </div>
            )}

            {/* Location */}
            {project.location && (
              <div
                className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse",
                )}
              >
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("projects.location", "Location")}:
                </span>
                <span className="text-sm">{project.location}</span>
              </div>
            )}

            {/* Manager */}
            {project.manager && (
              <div
                className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse",
                )}
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("projects.manager", "Manager")}:
                </span>
                <span className="text-sm">{project.manager}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Information */}
        {(project.client_name ||
          project.client_email ||
          project.client_phone) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base", textStart())}>
                {t("projects.clientInfo", "Client Information")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client Name */}
              {project.client_name && (
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isRTL && "flex-row-reverse",
                  )}
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {t("projects.clientName", "Client")}:
                  </span>
                  <span className="text-sm">{project.client_name}</span>
                </div>
              )}

              {/* Client Phone */}
              {project.client_phone && (
                <div
                  className={cn(
                    "flex items-center justify-between",
                    isRTL && "flex-row-reverse",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      isRTL && "flex-row-reverse",
                    )}
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{project.client_phone}</span>
                  </div>
                  {onCall && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCall(project.client_phone!)}
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}

              {/* Client Email */}
              {project.client_email && (
                <div
                  className={cn(
                    "flex items-center justify-between",
                    isRTL && "flex-row-reverse",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      isRTL && "flex-row-reverse",
                    )}
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">
                      {project.client_email}
                    </span>
                  </div>
                  {onEmail && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEmail(project.client_email!)}
                    >
                      <Mail className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className={cn("text-base", textStart())}>
              {t("projects.timeline", "Timeline")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse",
              )}
            >
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {t("projects.created", "Created")}:
              </span>
              <span className="text-sm text-muted-foreground">
                {formatDate(project.created_at)}
              </span>
            </div>

            {project.start_date && (
              <div
                className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse",
                )}
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("projects.startDate", "Start Date")}:
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(project.start_date)}
                </span>
              </div>
            )}

            {project.end_date && (
              <div
                className={cn(
                  "flex items-center gap-2",
                  isRTL && "flex-row-reverse",
                )}
              >
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("projects.endDate", "End Date")}:
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(project.end_date)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        {project.description && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base", textStart())}>
                {t("projects.description", "Description")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-sm text-muted-foreground leading-relaxed",
                  textStart(),
                )}
              >
                {project.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {project.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className={cn("text-base", textStart())}>
                {t("projects.notes", "Notes")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-sm text-muted-foreground leading-relaxed",
                  textStart(),
                )}
              >
                {project.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className={cn("flex flex-col gap-2", isRTL && "items-end")}>
              <div
                className={cn("flex gap-2 w-full", isRTL && "flex-row-reverse")}
              >
                {onMessage && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onMessage(project.id)}
                    className="flex-1"
                  >
                    <MessageSquare
                      className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")}
                    />
                    {t("projects.message", "Message")}
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(project)}
                    className="flex-1"
                  >
                    {t("common.edit", "Edit")}
                  </Button>
                )}
              </div>
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(project.id)}
                  className="w-full"
                >
                  {t("common.delete", "Delete Project")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
