from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import CompanyDocument, ExportGuide
from .serializers import CompanyDocumentSerializer, ExportGuideCountrySerializer, ExportGuideSerializer


DOCUMENT_LABELS = {
    'commercial_invoice': 'Commercial invoice template/document',
    'packing_list': 'Packing list template/document',
}

COUNTRY_REQUIRED_FIELDS = {
    'PK': [
        ('ntn', 'NTN', 'Add NTN to your company profile.'),
        ('psw_registered', 'PSW registration', 'Mark PSW registration as completed.'),
        ('bank_profile_linked', 'Authorized Dealer bank profile linking', 'Link your bank profile with your PSW business profile.'),
    ],
    'MY': [
        (('company_registration_no', 'ssm_registration_no'), 'Company / SSM registration number', 'Add company registration or SSM registration number.'),
        (('customs_docs_workflow_ready', 'customs_agent_assigned'), 'Customs documentation workflow or agent', 'Mark customs workflow ready or assign a customs agent.'),
    ],
    'CA': [
        ('business_number', 'Business Number', 'Add Canadian Business Number for exporter-side filing.'),
        ('rm_export_program_id', 'RM export/import program account', 'Add RM export program identifier.'),
    ],
    'AU': [
        ('abn', 'ABN', 'Add Australian Business Number.'),
        ('export_declaration_method', 'Export declaration method', 'Select self filing or customs agent.'),
    ],
    'SG': [
        ('uen', 'UEN', 'Add Unique Entity Number.'),
        ('customs_account_active', 'Activated Customs Account', 'Mark Singapore Customs Account as active.'),
    ],
    'GB': [
        ('eori_gb', 'GB EORI', 'Add GB EORI number.'),
        ('cds_subscribed', 'CDS subscription', 'Mark Customs Declaration Service subscription as completed.'),
    ],
}

COUNTRY_CONDITIONAL_FIELDS = {
    'MY': [
        ('miti_strategic_trade_ready', 'MITI Strategic Trade readiness', 'Conditional for strategic or controlled goods.'),
    ],
    'CA': [
        ('cers_account_ready', 'CERS account readiness', 'Recommended/conditional if your company self-files export declarations.'),
    ],
    'AU': [
        ('dcrn', 'DCRN', 'Conditional for defence or strategic goods.'),
    ],
    'SG': [
        ('tradenet_declarant_enabled', 'TradeNet declarant access', 'Conditional if your company self-files permits.'),
    ],
}


def exporter_required(user):
    return user.is_authenticated and getattr(user, 'user_type', None) == 'exporter'


def make_check(label, status_value, description='', source='company'):
    return {
        'label': label,
        'status': status_value,
        'description': description,
        'source': source,
    }


def document_is_available(document):
    if not document:
        return False
    if document.status != 'uploaded':
        return False
    if document.expiry_date and document.expiry_date < timezone.now().date():
        return False
    return bool(document.file or document.file_url)


def has_profile_value(store, field_or_fields):
    if isinstance(field_or_fields, tuple):
        return any(bool(getattr(store, field, None)) for field in field_or_fields)
    return bool(getattr(store, field_or_fields, None))


def profile_fields_payload(store):
    fields = [
        'ntn', 'strn', 'psw_registered', 'bank_profile_linked',
        'product_category', 'has_certificate_of_origin_support',
        'company_registration_no', 'ssm_registration_no',
        'customs_docs_workflow_ready', 'customs_agent_assigned',
        'miti_strategic_trade_ready', 'business_number', 'rm_export_program_id',
        'cers_account_ready', 'abn', 'export_declaration_method', 'dcrn',
        'uen', 'customs_account_active', 'tradenet_declarant_enabled',
        'eori_gb', 'cds_subscribed',
    ]
    return {field: getattr(store, field, None) for field in fields}


def build_readiness(user, guide=None, request=None):
    exporter_country_code = (guide.exporter_country_code if guide else '').upper()
    try:
        store = user.store
    except Exception:
        return {
            'exporterCountryCode': exporter_country_code,
            'completedChecks': [],
            'missingChecks': [
                make_check('Company/store profile', 'missing', 'Create your exporter store profile first.'),
            ],
            'conditionalChecks': [],
            'warnings': ['Company profile is unavailable.'],
            'sourceProfileFields': {},
            'missingDocuments': ['Company/store profile'],
        }

    documents = {
        item.document_type: item
        for item in CompanyDocument.objects.filter(store=store)
    }

    completed = []
    missing = []
    conditional = []
    warnings = []
    missing_documents = []

    for document_type, label in DOCUMENT_LABELS.items():
        document = documents.get(document_type)
        if document_is_available(document):
            completed.append(make_check(label, 'available', 'Uploaded in company documents.', 'document'))
        else:
            missing.append(make_check(label, 'missing', f'Upload {label.lower()}.', 'document'))
            missing_documents.append(label)

    for field_or_fields, label, missing_message in COUNTRY_REQUIRED_FIELDS.get(exporter_country_code, []):
        if has_profile_value(store, field_or_fields):
            completed.append(make_check(label, 'available', 'Available in company profile.'))
        else:
            missing.append(make_check(label, 'missing', missing_message))

    for field_or_fields, label, note in COUNTRY_CONDITIONAL_FIELDS.get(exporter_country_code, []):
        status_value = 'available' if has_profile_value(store, field_or_fields) else 'required_if_applicable'
        conditional.append(make_check(label, status_value, note))

    if getattr(store, 'has_certificate_of_origin_support', False):
        completed.append(make_check('Certificate of Origin/e-CO support', 'available', 'Marked available in company profile.'))
    else:
        conditional.append(make_check(
            'Certificate of Origin/e-CO support',
            'required_if_applicable',
            'May be required depending on shipment terms, trade agreement, and exporter country process.',
        ))

    product_category = (getattr(store, 'product_category', '') or '').lower()
    if product_category in {'food', 'agriculture', 'food_agriculture'}:
        conditional.append(make_check(
            'Health, phytosanitary, or biosecurity certificate',
            'required_if_applicable',
            'May be required for food, agriculture, plant, animal, or biosecurity-regulated products.',
        ))
    elif product_category == 'chemicals':
        conditional.append(make_check(
            'Chemical export permit',
            'required_if_applicable',
            'May be required for chemicals or controlled substances.',
        ))
    elif product_category in {'machinery', 'industrial_goods', 'machinery_industrial'}:
        conditional.append(make_check(
            'Technical, safety, or strategic goods permit',
            'required_if_applicable',
            'May be required for machinery, industrial goods, defence, or strategic items.',
        ))

    if not exporter_country_code:
        warnings.append('Exporter country guide is unavailable.')

    CompanyDocumentSerializer(
        documents.values(),
        many=True,
        context={'request': request},
    ).data

    return {
        'exporterCountryCode': exporter_country_code,
        'completedChecks': completed,
        'missingChecks': missing,
        'conditionalChecks': conditional,
        'warnings': warnings,
        'sourceProfileFields': profile_fields_payload(store),
        'missingDocuments': missing_documents,
    }


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def exporter_guide_countries(request):
    if not exporter_required(request.user):
        return Response({'error': 'Only exporters can access exporter guides'}, status=status.HTTP_403_FORBIDDEN)

    guides = ExportGuide.objects.all().order_by('exporter_country_name')
    return Response({'countries': ExportGuideCountrySerializer(guides, many=True).data})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def exporter_guide_detail(request, exporter_country_code):
    if not exporter_required(request.user):
        return Response({'error': 'Only exporters can access exporter guides'}, status=status.HTTP_403_FORBIDDEN)

    try:
        guide = ExportGuide.objects.get(exporter_country_code=exporter_country_code.upper())
    except ExportGuide.DoesNotExist:
        return Response({
            'status': 'unavailable',
            'message': 'Information unavailable for the selected exporter country.',
        }, status=status.HTTP_200_OK)

    if guide.status != 'available':
        return Response({
            'status': 'unavailable',
            'guide': ExportGuideSerializer(guide).data,
            'message': 'Information unavailable for the selected exporter country.',
        }, status=status.HTTP_200_OK)

    return Response(ExportGuideSerializer(guide).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def exporter_guide_readiness(request, exporter_country_code):
    if not exporter_required(request.user):
        return Response({'error': 'Only exporters can access exporter guides'}, status=status.HTTP_403_FORBIDDEN)

    guide = ExportGuide.objects.filter(exporter_country_code=exporter_country_code.upper()).first()
    if not guide or guide.status != 'available':
        return Response({
            'status': 'unavailable',
            'message': 'Information unavailable for the selected exporter country.',
            **build_readiness(request.user, None, request=request),
        }, status=status.HTTP_200_OK)

    return Response(build_readiness(request.user, guide, request=request))
