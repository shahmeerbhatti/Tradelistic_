from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('importer', 'Importer'),
        ('exporter', 'Exporter'),
    )
    user_type = models.CharField(
        max_length=10, 
        choices=USER_TYPE_CHOICES,
        blank=True,
        null=True,
        help_text='User type for regular users. Admin users do not need a type.'
    )
    email = models.EmailField(unique=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state_country = models.CharField(max_length=100, blank=True, null=True)
    is_superadmin = models.BooleanField(default=False)

    def is_exporter(self):
        return self.user_type == 'exporter' if self.user_type else False
