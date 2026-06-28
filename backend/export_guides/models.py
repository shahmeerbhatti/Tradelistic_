from django.db import models


class ExportGuide(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('unavailable', 'Unavailable'),
    ]

    exporter_country_code = models.CharField(max_length=8, unique=True)
    exporter_country_name = models.CharField(max_length=120)
    overview = models.TextField(blank=True)
    standard_export_documents = models.JSONField(default=list, blank=True)
    government_registrations = models.JSONField(default=list, blank=True)
    export_licences_permits = models.JSONField(default=list, blank=True)
    export_declaration_process = models.JSONField(default=list, blank=True)
    company_checklist_rules = models.JSONField(default=list, blank=True)
    warnings = models.JSONField(default=list, blank=True)
    official_sources = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['exporter_country_name']

    def __str__(self):
        return f"{self.exporter_country_name} ({self.exporter_country_code})"


class CompanyDocument(models.Model):
    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('missing', 'Missing'),
        ('expired', 'Expired'),
    ]

    store = models.ForeignKey('stores.Store', on_delete=models.CASCADE, related_name='company_documents')
    document_type = models.CharField(max_length=80)
    file = models.FileField(upload_to='company_documents/', null=True, blank=True)
    file_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='missing')
    expiry_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('store', 'document_type')
        ordering = ['document_type']
        indexes = [
            models.Index(fields=['store', 'document_type'], name='export_guid_store_i_04a30e_idx'),
            models.Index(fields=['status'], name='export_guid_status_43d8bd_idx'),
        ]

    def __str__(self):
        return f"{self.store.name} - {self.document_type}"
