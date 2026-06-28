from django.db import migrations


GUIDES = [
    {
        'country_code': 'PK',
        'country_name': 'Pakistan',
        'overview': 'Pakistan-side export processing should guide exporters around PSW Single Declaration Export and TDAP Electronic Certificate of Origin where required.',
        'documents_required': [
            'Commercial invoice',
            'Packing list',
            'Bill of lading or air waybill',
            'Goods declaration / Single Declaration export documents',
            'Certificate of Origin / e-CO if required by buyer or trade agreement',
        ],
        'licenses_registrations': [
            'NTN',
            'PSW registration',
            'Active bank account with Authorized Dealer',
            'Bank profile linked with PSW business profile',
            'Product-specific agency approval if applicable',
        ],
        'buyer_importer_requirements': [
            'Buyer may request Certificate of Origin',
            'Buyer may request product-specific certificates',
        ],
        'warnings': ['Export requirements may vary by product category.'],
        'official_sources': [
            {'label': 'Pakistan Single Window', 'url': 'https://www.psw.gov.pk/'},
            {'label': 'TDAP', 'url': 'https://tdap.gov.pk/'},
        ],
    },
    {
        'country_code': 'MY',
        'country_name': 'Malaysia',
        'overview': 'Malaysia guide shows general import-side requirements for Pakistani exporters shipping to Malaysia.',
        'documents_required': [
            'Commercial invoice',
            'Packing list',
            'Bill of lading or air waybill',
            'Certificate/proof of origin if preferential tariff is claimed',
            'Product-specific supporting documents if requested',
        ],
        'licenses_registrations': [
            'Approved Permit may apply to controlled categories such as motor vehicles, heavy machinery, iron/steel, and chemicals',
        ],
        'buyer_importer_requirements': [
            'Malaysian importer/customs agent normally handles import declaration and local permit filing',
        ],
        'warnings': ['Product-specific controls may apply.'],
        'official_sources': [
            {'label': 'Royal Malaysian Customs Department', 'url': 'https://www.customs.gov.my/'},
            {'label': 'MITI Malaysia', 'url': 'https://www.miti.gov.my/'},
        ],
    },
    {
        'country_code': 'CA',
        'country_name': 'Canada',
        'overview': 'Canada guide shows the exporter what the Canadian importer/customs broker will usually need.',
        'documents_required': [
            'Commercial invoice',
            'Goods description, weight, quantity, value',
            'Bill of lading or other transport document',
            'Certificate/proof of origin if needed',
            'Product-specific certificates if applicable',
        ],
        'licenses_registrations': [
            'Canadian importer must have Business Number/importer account',
            'Permits, certificates, or inspections may apply to regulated products',
        ],
        'buyer_importer_requirements': [
            'Canadian importer or broker submits release information to CBSA',
        ],
        'warnings': ['Exporter should provide accurate invoice and product details to avoid clearance delays.'],
        'official_sources': [
            {'label': 'Canada Border Services Agency', 'url': 'https://www.cbsa-asfc.gc.ca/'},
            {'label': 'Government of Canada importing guide', 'url': 'https://www.canada.ca/en/services/business/trade/import.html'},
        ],
    },
    {
        'country_code': 'AU',
        'country_name': 'Australia',
        'overview': 'Australia guide focuses on import declaration support documents and product-specific approvals.',
        'documents_required': [
            'Bill of lading or air waybill',
            'Commercial invoice',
            'Packing list',
            'Permits or approvals if required',
            'Other relevant supporting documents',
        ],
        'licenses_registrations': [
            'Product-specific permits may apply',
            'Biosecurity-related approvals may apply for food, plant, animal, wood, or agricultural products',
        ],
        'buyer_importer_requirements': [
            'Australian importer or licensed customs broker usually handles import declaration',
        ],
        'warnings': ['Restricted/prohibited goods require permission from the relevant authority.'],
        'official_sources': [
            {'label': 'Australian Border Force', 'url': 'https://www.abf.gov.au/'},
            {'label': 'Department of Agriculture, Fisheries and Forestry', 'url': 'https://www.agriculture.gov.au/'},
        ],
    },
    {
        'country_code': 'SG',
        'country_name': 'Singapore',
        'overview': 'Singapore guide explains that importers need a UEN, activated Customs Account, and Customs Import Permit through TradeNet.',
        'documents_required': [
            'Customs permit',
            'Commercial invoice',
            'Packing list',
            'Air waybill or bill of lading depending on cargo type',
        ],
        'licenses_registrations': [
            'UEN',
            'Activated Customs Account',
            'TradeNet permit',
            'Controlled goods approval if applicable',
        ],
        'buyer_importer_requirements': [
            'Singapore importer or declaring agent handles TradeNet permit application',
        ],
        'warnings': ['Controlled/dutiable goods need extra checks.'],
        'official_sources': [
            {'label': 'Singapore Customs', 'url': 'https://www.customs.gov.sg/'},
            {'label': 'TradeNet', 'url': 'https://www.tradenet.gov.sg/'},
        ],
    },
    {
        'country_code': 'GB',
        'country_name': 'United Kingdom',
        'overview': 'UK guide explains EORI, commodity code, import declaration, and product-specific licences.',
        'documents_required': [
            'Commercial invoice',
            'Packing list',
            'Bill of lading or air waybill',
            'Commodity code',
            'Certificate/licence if controlled goods',
        ],
        'licenses_registrations': [
            'UK importer may need EORI',
            'Product-specific licence or certificate may be required',
        ],
        'buyer_importer_requirements': [
            'UK importer/customs agent handles import declaration',
        ],
        'warnings': ['Commodity code determines duty and may determine whether import licence is needed.'],
        'official_sources': [
            {'label': 'GOV.UK Import goods into the UK', 'url': 'https://www.gov.uk/import-goods-into-uk'},
            {'label': 'HM Revenue & Customs', 'url': 'https://www.gov.uk/government/organisations/hm-revenue-customs'},
        ],
    },
]


def seed_guides(apps, schema_editor):
    ExportGuide = apps.get_model('export_guides', 'ExportGuide')
    for guide in GUIDES:
        ExportGuide.objects.update_or_create(
            country_code=guide['country_code'],
            defaults={
                **guide,
                'status': 'available',
                'company_checklist_rules': [
                    'NTN',
                    'PSW registration',
                    'Authorized Dealer bank profile linking',
                    'Commercial invoice template/document',
                    'Packing list template/document',
                    'Certificate of Origin/e-CO support if required',
                ],
            },
        )


def remove_guides(apps, schema_editor):
    ExportGuide = apps.get_model('export_guides', 'ExportGuide')
    ExportGuide.objects.filter(country_code__in=[guide['country_code'] for guide in GUIDES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('export_guides', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_guides, remove_guides),
    ]
