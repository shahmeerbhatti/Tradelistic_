from rest_framework import serializers

from .models import CompanyDocument, ExportGuide


class ExportGuideSerializer(serializers.ModelSerializer):
    exporterCountryCode = serializers.CharField(source='exporter_country_code', read_only=True)
    exporterCountryName = serializers.CharField(source='exporter_country_name', read_only=True)
    standardExportDocuments = serializers.JSONField(source='standard_export_documents', read_only=True)
    governmentRegistrations = serializers.JSONField(source='government_registrations', read_only=True)
    exportLicencesPermits = serializers.JSONField(source='export_licences_permits', read_only=True)
    exportDeclarationProcess = serializers.JSONField(source='export_declaration_process', read_only=True)
    companyChecklistRules = serializers.JSONField(source='company_checklist_rules', read_only=True)
    officialSources = serializers.JSONField(source='official_sources', read_only=True)
    lastUpdated = serializers.DateTimeField(source='last_updated', read_only=True)

    class Meta:
        model = ExportGuide
        fields = [
            'id', 'exporterCountryCode', 'exporterCountryName', 'overview',
            'standardExportDocuments', 'governmentRegistrations',
            'exportLicencesPermits', 'exportDeclarationProcess',
            'companyChecklistRules', 'warnings', 'officialSources',
            'status', 'lastUpdated',
        ]


class ExportGuideCountrySerializer(serializers.ModelSerializer):
    exporterCountryCode = serializers.CharField(source='exporter_country_code', read_only=True)
    exporterCountryName = serializers.CharField(source='exporter_country_name', read_only=True)

    class Meta:
        model = ExportGuide
        fields = ['exporterCountryCode', 'exporterCountryName', 'status']


class CompanyDocumentSerializer(serializers.ModelSerializer):
    documentType = serializers.CharField(source='document_type', read_only=True)
    fileUrl = serializers.SerializerMethodField()
    expiryDate = serializers.DateField(source='expiry_date', read_only=True)

    class Meta:
        model = CompanyDocument
        fields = ['id', 'documentType', 'fileUrl', 'status', 'expiryDate', 'created_at', 'updated_at']

    def get_fileUrl(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file_url or ''
