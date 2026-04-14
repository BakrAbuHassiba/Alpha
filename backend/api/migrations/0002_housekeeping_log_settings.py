from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="HousekeepingLogSettings",
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
                        default="Barcelo Hamburg, Ferdinandstrasse 15 in 20095 Hamburg",
                        help_text="Shown in the title area (first sheet row, like the Excel template).",
                        max_length=255,
                    ),
                ),
                ("label_tag", models.CharField(default="Tag", max_length=120)),
                (
                    "label_uhrzeit_von",
                    models.CharField(default="Uhrzeit von", max_length=120),
                ),
                (
                    "label_uhrzeit_bis",
                    models.CharField(default="Uhrzeit bis", max_length=120),
                ),
                (
                    "label_housekeeping_double",
                    models.CharField(
                        default="Housekeeping Doppelzimmer mit Check / ohne",
                        max_length=255,
                    ),
                ),
                (
                    "label_housekeeping_suites",
                    models.CharField(
                        default="Housekeeping Suiten mit Check / ohne",
                        max_length=255,
                    ),
                ),
                (
                    "label_aufbettung",
                    models.CharField(default="Aufbettung", max_length=120),
                ),
                (
                    "label_public",
                    models.CharField(
                        default="Public Früh / Spät", max_length=120
                    ),
                ),
                (
                    "label_extra",
                    models.CharField(
                        default="Extra-Leistungen", max_length=120
                    ),
                ),
                (
                    "label_unterschrift",
                    models.CharField(
                        default="Unterschrift Kunde", max_length=120
                    ),
                ),
                (
                    "footer_note",
                    models.TextField(
                        default="Digitale Abgabe bis zum 1. des Monats -> buchhaltung@alfagruppe.de",
                        help_text="Red notice below the table.",
                    ),
                ),
            ],
            options={
                "verbose_name": "Housekeeping log settings",
                "verbose_name_plural": "Housekeeping log settings",
            },
        ),
    ]
