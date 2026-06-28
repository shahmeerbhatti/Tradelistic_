from django.db import migrations


GUIDES = [
    {
        'exporter_country_code': 'PK',
        'exporter_country_name': 'Pakistan',
        'overview': 'Guidance for Pakistan-based exporters preparing general export documents, registrations, and export filing through Pakistan-side systems.',
        'standard_export_documents': [
            'Commercial invoice',
            'Packing list',
            'Bill of lading or air waybill',
            'Goods declaration / PSW Single Declaration export documents',
            'Certificate of Origin / e-CO if required by buyer, product, or trade agreement',
        ],
        'government_registrations': [
            'NTN',
            'PSW registration',
            'Active account with Authorized Dealer bank',
            'Bank profile linked with PSW business profile',
        ],
        'export_licences_permits': [
            'Product-specific agency approval if applicable',
            'Certificate of Origin or TDAP e-CO if applicable',
            'Health, phytosanitary, chemical, or strategic goods approval if applicable',
        ],
        'export_declaration_process': [
            'Prepare invoice, packing list, and transport documents',
            'Complete export filing through PSW Single Declaration where applicable',
            'Coordinate Authorized Dealer bank profile and export proceeds workflow',
            'Obtain Certificate of Origin/e-CO if required',
        ],
        'warnings': ['Pakistan export requirements may vary by product category and applicable trade agreement.'],
        'official_sources': [
            {'label': 'Pakistan Single Window', 'url': 'https://www.psw.gov.pk/'},
            {'label': 'TDAP', 'url': 'https://tdap.gov.pk/'},
        ],
    },
    {
        'exporter_country_code': 'MY',
        'exporter_country_name': 'Malaysia',
        'overview': 'Guidance for Malaysia-based exporters preparing export documents, company registration evidence, customs workflow, and product permits.',
        'standard_export_documents': [
            'Commercial invoice',
            'Packing list',
            'Bill of lading or air waybill',
            'Certificate/proof of origin if preferential tariff is claimed',
            'Product-specific supporting certificates if applicable',
        ],
        'government_registrations': [
            'Company registration / SSM registration',
            'Customs documentation workflow or appointed customs agent',
        ],
        'export_licences_permits': [
            'MITI Strategic Trade readiness if goods are strategic or controlled',
            'Approved Permit or product-specific approval if applicable',
        ],
        'export_declaration_process': [
            'Prepare export documents and product classification details',
            'Confirm whether goods require permits or strategic trade controls',
            'Submit export/customs documentation through assigned workflow or agent',
        ],
        'warnings': ['Controlled or strategic products may require additional approvals before export.'],
        'official_sources': [
            {'label': 'Royal Malaysian Customs Department', 'url': 'https://www.customs.gov.my/'},
            {'label': 'MITI Malaysia', 'url': 'https://www.miti.gov.my/'},
        ],
    },
    {
        'exporter_country_code': 'CA',
        'exporter_country_name': 'Canada',
        'overview': 'Guidance for Canada-based exporters preparing exporter-side registrations, export reporting, and standard shipment documentation.',
        'standard_export_documents': [
            'Commercial invoice',
            'Packing list',
            'Goods description, weight, quantity, and value',
            'Bill of lading or other transport document',
            'Certificate/proof of origin if needed',
        ],
        'government_registrations': [
            'Business Number',
            'RM export/import program account',
            'CERS account if self-filing export declarations',
        ],
        'export_licences_permits': [
            'Export permit if goods are controlled',
            'Product-specific certificate if applicable',
        ],
        'export_declaration_process': [
            'Prepare accurate invoice and product details',
            'Determine whether export reporting is required',
            'File through CERS or use a customs service provider if applicable',
        ],
        'warnings': ['Controlled goods and certain destinations may require permits or additional export reporting.'],
        'official_sources': [
            {'label': 'Canada Border Services Agency', 'url': 'https://www.cbsa-asfc.gc.ca/'},
            {'label': 'Government of Canada export controls', 'url': 'https://www.international.gc.ca/controls-controles/'},
        ],
    },
    {
        'exporter_country_code': 'AU',
        'exporter_country_name': 'Australia',
        'overview': 'Guidance for Australia-based exporters preparing export documents, ABN details, declaration method, and product-specific approvals.',
        'standard_export_documents': [
            'Commercial invoice',
            'Packing list',
            'Bill of lading or air waybill',
            'Export declaration evidence if required',
            'Other product-specific supporting documents',
        ],
        'government_registrations': [
            'ABN',
            'Export declaration method: self filing or customs agent',
        ],
        'export_licences_permits': [
            'Product-specific permits may apply',
            'Biosecurity approvals for food, plant, animal, wood, or agricultural products',
            'DCRN may be required for defence goods',
        ],
        'export_declaration_process': [
            'Prepare shipment documents and confirm whether goods require export declaration',
            'Use self filing or appointed customs agent workflow',
            'Obtain restricted/prohibited goods permission if required',
        ],
        'warnings': ['Restricted/prohibited goods require permission from the relevant authority before export.'],
        'official_sources': [
            {'label': 'Australian Border Force', 'url': 'https://www.abf.gov.au/'},
            {'label': 'Department of Agriculture, Fisheries and Forestry', 'url': 'https://www.agriculture.gov.au/'},
        ],
    },
    {
        'exporter_country_code': 'SG',
        'exporter_country_name': 'Singapore',
        'overview': 'Guidance for Singapore-based exporters using UEN, Customs Account, and TradeNet workflows for exporter-side permits and declarations.',
        'standard_export_documents': [
            'Commercial invoice',
            'Packing list',
            'Air waybill or bill of lading depending on cargo type',
            'Customs export permit where applicable',
        ],
        'government_registrations': [
            'UEN',
            'Activated Customs Account',
            'TradeNet declarant access if self-filing',
        ],
        'export_licences_permits': [
            'TradeNet permit if applicable',
            'Controlled goods approval if applicable',
        ],
        'export_declaration_process': [
            'Confirm Customs Account and declarant arrangement',
            'Prepare shipment and invoice data',
            'Apply for required permit through TradeNet or declaring agent',
        ],
        'warnings': ['Controlled or dutiable goods need extra checks before export.'],
        'official_sources': [
            {'label': 'Singapore Customs', 'url': 'https://www.customs.gov.sg/'},
            {'label': 'TradeNet', 'url': 'https://www.tradenet.gov.sg/'},
        ],
    },
    {
        'exporter_country_code': 'GB',
        'exporter_country_name': 'United Kingdom',
        'overview': 'Guidance for United Kingdom-based exporters preparing EORI, CDS access, commodity code, export declarations, and export licences.',
        'standard_export_documents': [
            'Commercial invoice',
            'Packing list',
            'Bill of lading or air waybill',
            'Commodity code',
            'Certificate/licence if controlled goods',
        ],
        'government_registrations': [
            'GB EORI',
            'Customs Declaration Service subscription',
        ],
        'export_licences_permits': [
            'Product-specific export licence or certificate may be required',
            'Controlled goods licence if applicable',
        ],
        'export_declaration_process': [
            'Prepare invoice, packing list, commodity code, and transport document',
            'Submit export declaration using CDS or customs agent',
            'Confirm whether product-specific licence is required',
        ],
        'warnings': ['Commodity code and product controls determine whether export licence or certificate is needed.'],
        'official_sources': [
            {'label': 'GOV.UK Export goods from the UK', 'url': 'https://www.gov.uk/export-goods'},
            {'label': 'HM Revenue & Customs', 'url': 'https://www.gov.uk/government/organisations/hm-revenue-customs'},
        ],
    },
]


def seed_guides(apps, schema_editor):
    ExportGuide = apps.get_model('export_guides', 'ExportGuide')
    for guide in GUIDES:
        ExportGuide.objects.update_or_create(
            exporter_country_code=guide['exporter_country_code'],
            defaults={
                **guide,
                'status': 'available',
                'company_checklist_rules': [
                    'Commercial invoice template/document',
                    'Packing list template/document',
                    'Exporter-country government registration',
                    'Exporter-country declaration filing workflow',
                    'Certificate of Origin/e-CO support if applicable',
                    'Product-specific export licence or permit if applicable',
                ],
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ('export_guides', '0003_origin_country_schema'),
    ]

    operations = [
        migrations.RunPython(seed_guides, migrations.RunPython.noop),
    ]
