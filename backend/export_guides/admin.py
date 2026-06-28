from django.contrib import admin

from .models import CompanyDocument, ExportGuide


@admin.register(ExportGuide)
class ExportGuideAdmin(admin.ModelAdmin):
    list_display = ('exporter_country_name', 'exporter_country_code', 'status', 'last_updated')
    search_fields = ('exporter_country_name', 'exporter_country_code')
    list_filter = ('status',)


@admin.register(CompanyDocument)
class CompanyDocumentAdmin(admin.ModelAdmin):
    list_display = ('store', 'document_type', 'status', 'expiry_date', 'updated_at')
    search_fields = ('store__name', 'document_type')
    list_filter = ('status', 'document_type')
