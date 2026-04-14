import django.core.validators
from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="TimesheetSettings",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "hotel_name",
                    models.CharField(
                        default="Stundennachweis fuer Hotel Barcelo, Hamburg",
                        help_text="Shown as the main title on the timesheet (e.g. hotel name).",
                        max_length=255,
                    ),
                ),
                (
                    "verhaltnis",
                    models.DecimalField(
                        decimal_places=4,
                        default=Decimal("1"),
                        help_text="Divisor for Std. gesamt: rooms / this value (was per-row Verhältnis).",
                        max_digits=12,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.0001"))
                        ],
                    ),
                ),
            ],
            options={
                "verbose_name": "Timesheet settings",
                "verbose_name_plural": "Timesheet settings",
            },
        ),
    ]
