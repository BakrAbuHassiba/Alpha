from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.contrib.auth.models import User


class ActiveTimesheet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="active_timesheet")
    updated_at = models.DateTimeField(auto_now=True)
    month = models.CharField(max_length=20, default="", blank=True)
    year = models.CharField(max_length=4, default="", blank=True)
    employee_name = models.CharField(max_length=255, default="", blank=True)
    pers_nr = models.CharField(max_length=50, default="", blank=True)
    data = models.JSONField(default=list, blank=True)

class ActiveHousekeeping(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="active_housekeeping")
    updated_at = models.DateTimeField(auto_now=True)
    month = models.CharField(max_length=20, default="", blank=True)
    year = models.CharField(max_length=4, default="", blank=True)
    employee_name = models.CharField(max_length=255, default="", blank=True)
    pers_nr = models.CharField(max_length=50, default="", blank=True)
    data = models.JSONField(default=list, blank=True)


class TimesheetSubmission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="timesheets")
    submitted_at = models.DateTimeField(auto_now_add=True)
    month = models.CharField(max_length=20, default="", blank=True)
    year = models.CharField(max_length=4, default="", blank=True)
    employee_name = models.CharField(max_length=255, default="", blank=True)
    pers_nr = models.CharField(max_length=50, default="", blank=True)
    data = models.JSONField(help_text="Array of timesheet rows")

    class Meta:
        verbose_name = "Timesheet submission"
        verbose_name_plural = "Timesheet submissions"
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.user.username} - {self.month} {self.year} ({self.submitted_at.strftime('%Y-%m-%d %H:%M')})"


class HousekeepingSubmission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="housekeeping_logs")
    submitted_at = models.DateTimeField(auto_now_add=True)
    month = models.CharField(max_length=20, default="", blank=True)
    year = models.CharField(max_length=4, default="", blank=True)
    employee_name = models.CharField(max_length=255, default="", blank=True)
    pers_nr = models.CharField(max_length=50, default="", blank=True)
    data = models.JSONField(help_text="Array of housekeeping log rows")

    class Meta:
        verbose_name = "Housekeeping submission"
        verbose_name_plural = "Housekeeping submissions"
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.user.username} - {self.month} {self.year} ({self.submitted_at.strftime('%Y-%m-%d %H:%M')})"
class TimesheetSettings(models.Model):
    """
    Single row (pk=1) edited in Django admin: hotel title line and Verhältnis for Std. gesamt.
    """

    hotel_name = models.CharField(
        max_length=255,
        default="Stundennachweis fuer Hotel Barcelo, Hamburg",
        help_text="Shown as the main title on the timesheet (e.g. hotel name).",
    )
    verhaltnis = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        default=Decimal("1"),
        validators=[MinValueValidator(Decimal("0.0001"))],
        help_text="Divisor for Std. gesamt: rooms / this value (was per-row Verhältnis).",
    )

    class Meta:
        verbose_name = "Timesheet settings"
        verbose_name_plural = "Timesheet settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass


class HousekeepingLogSettings(models.Model):
    """
    Single row (pk=1): hotel line + all column labels for the housekeeping daily log page.
    """

    hotel_name = models.CharField(
        max_length=255,
        default="Barcelo Hamburg, Ferdinandstrasse 15 in 20095 Hamburg",
        help_text="Shown in the title area (first sheet row, like the Excel template).",
    )
    label_tag = models.CharField(max_length=120, default="Tag")
    label_uhrzeit_von = models.CharField(max_length=120, default="Uhrzeit von")
    label_uhrzeit_bis = models.CharField(max_length=120, default="Uhrzeit bis")
    label_housekeeping_double = models.CharField(
        max_length=255,
        default="Housekeeping Doppelzimmer mit Check / ohne",
    )
    label_housekeeping_suites = models.CharField(
        max_length=255,
        default="Housekeeping Suiten mit Check / ohne",
    )
    label_aufbettung = models.CharField(max_length=120, default="Aufbettung")
    label_public = models.CharField(max_length=120, default="Public Früh / Spät")
    label_extra = models.CharField(max_length=120, default="Extra-Leistungen")
    label_unterschrift = models.CharField(
        max_length=120, default="Unterschrift Kunde"
    )
    footer_note = models.TextField(
        default="Digitale Abgabe bis zum 1. des Monats -> buchhaltung@alfagruppe.de",
        help_text="Red notice below the table.",
    )

    class Meta:
        verbose_name = "Housekeeping log settings"
        verbose_name_plural = "Housekeeping log settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass
