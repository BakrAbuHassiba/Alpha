from decimal import Decimal

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .models import (
    HousekeepingLogSettings,
    TimesheetSettings,
    TimesheetSubmission,
    HousekeepingSubmission,
    ActiveTimesheet,
    ActiveHousekeeping,
)


class TimesheetSettingsView(APIView):
    """
    Public read-only settings for the React timesheet.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        obj, _ = TimesheetSettings.objects.get_or_create(
            pk=1,
            defaults={
                "hotel_name": "Stundennachweis fuer Hotel Barcelo, Hamburg",
                "verhaltnis": Decimal("1"),
            },
        )
        return Response(
            {
                "hotel_name": obj.hotel_name,
                "verhaltnis": float(obj.verhaltnis),
            }
        )


class HousekeepingLogSettingsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        obj, _ = HousekeepingLogSettings.objects.get_or_create(
            pk=1,
            defaults={
                "hotel_name": "Barcelo Hamburg, Ferdinandstrasse 15 in 20095 Hamburg",
            },
        )
        return Response(
            {
                "hotel_name": obj.hotel_name,
                "label_tag": obj.label_tag,
                "label_uhrzeit_von": obj.label_uhrzeit_von,
                "label_uhrzeit_bis": obj.label_uhrzeit_bis,
                "label_housekeeping_double": obj.label_housekeeping_double,
                "label_housekeeping_suites": obj.label_housekeeping_suites,
                "label_aufbettung": obj.label_aufbettung,
                "label_public": obj.label_public,
                "label_extra": obj.label_extra,
                "label_unterschrift": obj.label_unterschrift,
                "footer_note": obj.footer_note,
            }
        )


class ActiveTimesheetView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        active_sheet, _ = ActiveTimesheet.objects.get_or_create(user=request.user)
        return Response({
            "month": active_sheet.month,
            "year": active_sheet.year,
            "employee_name": active_sheet.employee_name,
            "pers_nr": active_sheet.pers_nr,
            "data": active_sheet.data,
        })

    def post(self, request):
        active_sheet, _ = ActiveTimesheet.objects.get_or_create(user=request.user)
        active_sheet.month = request.data.get("month", "")
        active_sheet.year = request.data.get("year", "")
        active_sheet.employee_name = request.data.get("employee_name", "")
        active_sheet.pers_nr = request.data.get("pers_nr", "")
        active_sheet.data = request.data.get("data", [])
        active_sheet.save()
        return Response({"status": "ok"})


class ActiveHousekeepingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        active_sheet, _ = ActiveHousekeeping.objects.get_or_create(user=request.user)
        return Response({
            "month": active_sheet.month,
            "year": active_sheet.year,
            "employee_name": active_sheet.employee_name,
            "pers_nr": active_sheet.pers_nr,
            "data": active_sheet.data,
        })

    def post(self, request):
        active_sheet, _ = ActiveHousekeeping.objects.get_or_create(user=request.user)
        active_sheet.month = request.data.get("month", "")
        active_sheet.year = request.data.get("year", "")
        active_sheet.employee_name = request.data.get("employee_name", "")
        active_sheet.pers_nr = request.data.get("pers_nr", "")
        active_sheet.data = request.data.get("data", [])
        active_sheet.save()
        return Response({"status": "ok"})


class TimesheetSubmissionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        month = request.data.get("month", "")
        year = request.data.get("year", "")
        employee_name = request.data.get("employee_name", "")
        pers_nr = request.data.get("pers_nr", "")
        data = request.data.get("data", [])
        submission = TimesheetSubmission.objects.create(
            user=request.user, month=month, year=year, employee_name=employee_name, pers_nr=pers_nr, data=data
        )
        ActiveTimesheet.objects.filter(user=request.user).update(
            month="", year="", employee_name="", pers_nr="", data=[]
        )
        return Response({"id": submission.id}, status=status.HTTP_201_CREATED)


class HousekeepingSubmissionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        month = request.data.get("month", "")
        year = request.data.get("year", "")
        employee_name = request.data.get("employee_name", "")
        pers_nr = request.data.get("pers_nr", "")
        data = request.data.get("data", [])
        submission = HousekeepingSubmission.objects.create(
            user=request.user, month=month, year=year, employee_name=employee_name, pers_nr=pers_nr, data=data
        )
        ActiveHousekeeping.objects.filter(user=request.user).update(
            month="", year="", employee_name="", pers_nr="", data=[]
        )
        return Response({"id": submission.id}, status=status.HTTP_201_CREATED)


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser,
            "username": request.user.username,
        })


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        active_timesheets = list(ActiveTimesheet.objects.all().values(
            "id", "user__username", "updated_at", "month", "year", "employee_name", "pers_nr", "data"
        ))
        active_housekeeping = list(ActiveHousekeeping.objects.all().values(
            "id", "user__username", "updated_at", "month", "year", "employee_name", "pers_nr", "data"
        ))
        sub_timesheets = list(TimesheetSubmission.objects.all().values(
            "id", "user__username", "submitted_at", "month", "year", "employee_name", "pers_nr", "data"
        ))
        sub_housekeeping = list(HousekeepingSubmission.objects.all().values(
            "id", "user__username", "submitted_at", "month", "year", "employee_name", "pers_nr", "data"
        ))
        
        return Response({
            "active_timesheets": active_timesheets,
            "active_housekeeping": active_housekeeping,
            "submitted_timesheets": sub_timesheets,
            "submitted_housekeeping": sub_housekeeping,
        })
