import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  User,
  MapPin,
  Phone,
  Video,
  Globe,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface CalendlyMeetingCardProps {
  meeting: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: "active" | "canceled";
    event_type: string;
    location?: {
      type: string;
      location?: string;
      join_url?: string;
    };
    invitees: Array<{
      name: string;
      email: string;
      status: string;
    }>;
    meeting_notes?: string;
  };
  onViewDetails?: () => void;
  compact?: boolean;
}

const CalendlyMeetingCard: React.FC<CalendlyMeetingCardProps> = ({
  meeting,
  onViewDetails,
  compact = false,
}) => {
  const getLocationIcon = () => {
    if (!meeting.location) return <MapPin className="h-4 w-4" />;

    switch (meeting.location.type) {
      case "zoom":
      case "google_meet":
      case "microsoft_teams":
        return <Video className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "physical":
        return <MapPin className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getStatusIcon = () => {
    switch (meeting.status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "canceled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (meeting.status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  if (compact) {
    return (
      <div
        className="p-2 rounded bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
        onClick={onViewDetails}
      >
        <div className="text-xs font-medium truncate">{meeting.title}</div>
        <div className="text-xs">{formatTime(meeting.start_time)}</div>
        {meeting.invitees.length > 0 && (
          <div className="text-xs text-blue-600 truncate">
            {meeting.invitees[0].name}
            {meeting.invitees.length > 1 && ` +${meeting.invitees.length - 1}`}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium text-lg">{meeting.title}</h3>
            <p className="text-sm text-gray-600">{meeting.event_type}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>{meeting.status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium">
                {formatDate(meeting.start_time)}
              </div>
              <div className="text-gray-600">
                {formatTime(meeting.start_time)} -{" "}
                {formatTime(meeting.end_time)}
              </div>
            </div>
          </div>

          {meeting.location && (
            <div className="flex items-center gap-2 text-sm">
              {getLocationIcon()}
              <div>
                <div className="font-medium">
                  {meeting.location.join_url ? (
                    <a
                      href={meeting.location.join_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {meeting.location.type}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    meeting.location.type
                  )}
                </div>
                {meeting.location.location && (
                  <div className="text-gray-600 truncate">
                    {meeting.location.location}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {meeting.invitees.length > 0 && (
          <div className="mb-3">
            <div className="text-sm font-medium mb-1">Attendees:</div>
            <div className="space-y-1">
              {meeting.invitees.slice(0, 2).map((invitee, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <User className="h-3 w-3 text-gray-500" />
                  <span>{invitee.name}</span>
                  <span className="text-gray-500">({invitee.email})</span>
                  <Badge variant="secondary" className="text-xs">
                    {invitee.status}
                  </Badge>
                </div>
              ))}
              {meeting.invitees.length > 2 && (
                <div className="text-xs text-gray-500">
                  +{meeting.invitees.length - 2} more attendees
                </div>
              )}
            </div>
          </div>
        )}

        {meeting.meeting_notes && (
          <div className="mb-3">
            <div className="text-sm font-medium mb-1">Notes:</div>
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {meeting.meeting_notes.length > 100
                ? `${meeting.meeting_notes.substring(0, 100)}...`
                : meeting.meeting_notes}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={onViewDetails}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            View Details
          </Button>
          {meeting.location?.join_url && (
            <Button
              onClick={() => window.open(meeting.location?.join_url, "_blank")}
              size="sm"
              className="flex-1"
            >
              <Video className="h-4 w-4 mr-1" />
              Join
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendlyMeetingCard;
