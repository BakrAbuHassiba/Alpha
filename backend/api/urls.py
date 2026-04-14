from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token

from .views import (
    HousekeepingLogSettingsView,
    TimesheetSettingsView,
    TimesheetSubmissionView,
    HousekeepingSubmissionView,
    ActiveTimesheetView,
    ActiveHousekeepingView,
    UserMeView,
    AdminDashboardView,
)

urlpatterns = [
    path("login/", obtain_auth_token, name="api_token_auth"),
    path("me/", UserMeView.as_view(), name="user-me"),
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("settings/", TimesheetSettingsView.as_view(), name="timesheet-settings"),
    path(
        "timesheet/active/",
        ActiveTimesheetView.as_view(),
        name="timesheet-active",
    ),
    path(
        "timesheet/submit/",
        TimesheetSubmissionView.as_view(),
        name="timesheet-submit",
    ),
    path(
        "housekeeping-log/",
        HousekeepingLogSettingsView.as_view(),
        name="housekeeping-log-settings",
    ),
    path(
        "housekeeping-log/active/",
        ActiveHousekeepingView.as_view(),
        name="housekeeping-log-active",
    ),
    path(
        "housekeeping-log/submit/",
        HousekeepingSubmissionView.as_view(),
        name="housekeeping-log-submit",
    ),
]
