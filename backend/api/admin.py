from django.contrib import admin
from django.urls import path
from django.http import HttpResponse
from django.utils.html import format_html

from .models import (
    HousekeepingLogSettings,
    TimesheetSettings,
    TimesheetSubmission,
    HousekeepingSubmission,
)


# Helper functions ported from frontend print logic
def _time_to_minutes(time_str):
    try:
        if not time_str:
            return 0
        parts = str(time_str).split(":")
        if len(parts) != 2:
            return 0
        hours = int(parts[0])
        minutes = int(parts[1])
        return hours * 60 + minutes
    except Exception:
        return 0


def _pause_to_minutes(pause_val):
    try:
        if pause_val is None or pause_val == "":
            return 0
        # normalize comma as dot
        s = str(pause_val).replace(",", ".")
        v = float(s)
        # clamp between 0 and 0.6 (frontend stores pause as 0.30 meaning 30 minutes)
        v = max(0.0, min(0.6, v))
        minutes = round(v * 100)
        # frontend maps >=60 to 1 hour
        if minutes >= 60:
            return 60
        return minutes
    except Exception:
        return 0


def calc_sum_minutes(start, end, pause):
    start_min = _time_to_minutes(start)
    end_min = _time_to_minutes(end)

    if start_min == 0 and end_min == 0:
        return 0

    if start_min == end_min:
        duration = 0
    else:
        direct = end_min - start_min
        if direct > 0:
            duration = direct
        else:
            # wrapped past midnight
            duration = end_min + (24 * 60) - start_min

    return duration + _pause_to_minutes(pause)


def format_minutes_as_hour(total_minutes):
    try:
        mins = max(0, int(round(total_minutes)))
        hours = mins // 60
        minutes = mins % 60
        return f"{hours},{minutes:02d}"
    except Exception:
        return "0,00"


def calculate_std_gesamt(rooms, ratio):
    try:
        # rooms may be string with comma
        r = str(rooms).replace(",", ".")
        rooms_val = float(r) if r not in ("", "None") else 0.0
    except Exception:
        rooms_val = 0.0
    try:
        ratio_val = float(ratio)
    except Exception:
        ratio_val = 1.0

    if ratio_val <= 0:
        return 0.0
    return rooms_val / ratio_val


@admin.register(TimesheetSettings)
class TimesheetSettingsAdmin(admin.ModelAdmin):
    list_display = ("hotel_name", "verhaltnis")

    def has_add_permission(self, request):
        return not TimesheetSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(TimesheetSubmission)
class TimesheetSubmissionAdmin(admin.ModelAdmin):
    list_display = ["user", "month", "year", "submitted_at", "print_link"]
    list_filter = ["user", "month", "year"]

    def print_link(self, obj):
        return format_html('<a href="{}/print/" target="_blank">PDF Export / Drucken</a>', obj.id)
    print_link.short_description = "Aktionen"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:object_id>/print/', self.admin_site.admin_view(self.print_view), name='timesheet-print'),
        ]
        return custom_urls + urls

    def print_view(self, request, object_id):
        obj = self.get_object(request, object_id)
        if not obj:
            return HttpResponse("Not found")
        
        name = getattr(obj, "employee_name", "") or f"{obj.user.last_name}, {obj.user.first_name}".strip(", ") or obj.user.username
        pers_nr = getattr(obj, "pers_nr", "")

        html = f"<html><head><title>Timesheet {obj}</title><style>body {{font-family: sans-serif;}} table {{border-collapse: collapse; width: 100%;}} th, td {{border: 1px solid black; padding: 6px; text-align: center;}} @media print {{ .no-print {{ display: none; }} }} .header-info {{ margin-bottom: 20px; font-size: 16px; font-weight: bold; }} .header-info div {{ margin-bottom: 5px; }}</style></head><body onload='window.print()'>"
        html += f"<h1>Stundennachweis</h1>"
        html += "<button class='no-print' onclick='window.print()'>Als PDF speichern / Drucken</button><br><br>"
        html += f"<div class='header-info'>"
        html += f"<div>Monat: {obj.month}</div>"
        html += f"<div>Nachname, Vorname: {name}</div>"
        html += f"<div>Pers.Nr.: {pers_nr}</div>"
        html += f"</div>"
        
        ratio = TimesheetSettings.objects.get(pk=1).verhaltnis if TimesheetSettings.objects.exists() else 1
        
        html += "<table><tr><th>Tag</th><th>Uhrzeit von</th><th>Uhrzeit bis</th><th>Pause</th><th>Anzahl der Stunden</th><th>Gereinigte Zimmer</th><th>Std. gesamt</th><th>Unterschrift Kunde</th></tr>"
        data_list = obj.data if isinstance(obj.data, list) else []
        for row in data_list:
            if not isinstance(row, dict): continue
            day = row.get('day', '')
            s = row.get('start', '')
            e = row.get('end', '')
            p = row.get('pause', '')
            r = row.get('rooms', '')
            sig = row.get('signature', '')

            sum_mins = calc_sum_minutes(s, e, p)
            anzahl = format_minutes_as_hour(sum_mins)
            
            std_gesamt = calculate_std_gesamt(r, ratio)
            std_gesamt_fmt = f"{std_gesamt:.2f}".replace('.', ',') if std_gesamt > 0 else ""

            html += f"<tr><td>{day}</td><td>{s}</td><td>{e}</td><td>{p}</td><td>{anzahl}</td><td>{r}</td><td>{std_gesamt_fmt}</td><td>{sig}</td></tr>"
        html += "</table></body></html>"
        return HttpResponse(html)


@admin.register(HousekeepingSubmission)
class HousekeepingSubmissionAdmin(admin.ModelAdmin):
    list_display = ["user", "month", "year", "submitted_at", "print_link"]
    list_filter = ["user", "month", "year"]

    def print_link(self, obj):
        return format_html('<a href="{}/print/" target="_blank">PDF Export / Drucken</a>', obj.id)
    print_link.short_description = "Aktionen"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:object_id>/print/', self.admin_site.admin_view(self.print_view), name='housekeeping-print'),
        ]
        return custom_urls + urls

    def print_view(self, request, object_id):
        obj = self.get_object(request, object_id)
        if not obj:
            return HttpResponse("Not found")
        
        name = getattr(obj, "employee_name", "") or f"{obj.user.last_name}, {obj.user.first_name}".strip(", ") or obj.user.username
        pers_nr = getattr(obj, "pers_nr", "")

        html = f"<html><head><title>Housekeeping {obj}</title><style>body {{font-family: sans-serif;}} table {{border-collapse: collapse; width: 100%;}} th, td {{border: 1px solid black; padding: 4px; text-align: center; font-size: 12px;}} @media print {{ .no-print {{ display: none; }} }} .header-info {{ margin-bottom: 20px; font-size: 16px; font-weight: bold; }} .header-info div {{ margin-bottom: 5px; }}</style></head><body onload='window.print()'>"
        html += f"<h1>Housekeeping-Log</h1>"
        html += "<button class='no-print' onclick='window.print()'>Als PDF speichern / Drucken</button><br><br>"
        html += f"<div class='header-info'>"
        html += f"<div>Monat: {obj.month}</div>"
        html += f"<div>Nachname, Vorname: {name}</div>"
        html += f"<div>Pers.Nr.: {pers_nr}</div>"
        html += f"</div>"

        html += "<table><tr><th>Tag</th><th>Von</th><th>Bis</th><th>Double Mit</th><th>Double Ohne</th><th>Suite Mit</th><th>Suite Ohne</th><th>Aufbettung</th><th>Public</th><th>Extra</th><th>Unterschrift</th></tr>"
        data_list = obj.data if isinstance(obj.data, list) else []
        for row in data_list:
            if not isinstance(row, dict): continue
            day = row.get('day', '')
            s = row.get('start', '')
            e = row.get('end', '')
            d1 = row.get('housekeepingDoubleMit', '')
            d2 = row.get('housekeepingDoubleOhne', '')
            s1 = row.get('housekeepingSuiteMit', '')
            s2 = row.get('housekeepingSuiteOhne', '')
            a = row.get('aufbettung', '')
            p = row.get('publicShift', '')
            ex = row.get('extra', '')
            sig = row.get('signature', '')
            html += f"<tr><td>{day}</td><td>{s}</td><td>{e}</td><td>{d1}</td><td>{d2}</td><td>{s1}</td><td>{s2}</td><td>{a}</td><td>{p}</td><td>{ex}</td><td>{sig}</td></tr>"
        html += "</table></body></html>"
        return HttpResponse(html)


@admin.register(HousekeepingLogSettings)
class HousekeepingLogSettingsAdmin(admin.ModelAdmin):
    list_display = ("hotel_name",)

    fieldsets = (
        (None, {"fields": ("hotel_name", "footer_note")}),
        (
            "Spaltenüberschriften (oben und unten)",
            {
                "fields": (
                    "label_tag",
                    "label_uhrzeit_von",
                    "label_uhrzeit_bis",
                    "label_housekeeping_double",
                    "label_housekeeping_suites",
                    "label_aufbettung",
                    "label_public",
                    "label_extra",
                    "label_unterschrift",
                ),
            },
        ),
    )

    def has_add_permission(self, request):
        return not HousekeepingLogSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
