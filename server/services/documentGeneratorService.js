const prisma = require('../db');

class DocumentGeneratorService {

    /**
     * Generate a contract template based on type
     */
    async generateContract(type, data) {
        console.log(`📄 Generating document of type: ${type}`);

        const templates = {
            'MARKETING_AUTH': this.getMarketingAuthTemplate,
            'SHOWING_FORM': this.getShowingFormTemplate,
            'SALES_AGREEMENT': this.getSalesAgreementTemplate
        };

        if (!templates[type]) throw new Error('Invalid document type');

        const content = templates[type](data);

        // In a real environment, we'd use 'pdfkit' or 'puppeteer' to render PDF
        // For now, we return the structured metadata and text content
        return {
            title: `Trio Emlak - ${type} - ${new Date().toLocaleDateString('tr-TR')}`,
            content,
            generatedAt: new Date(),
            metadata: {
                propertyId: data.propertyId,
                clientId: data.clientId,
                officerId: data.officerId
            }
        };
    }

    getMarketingAuthTemplate(data) {
        return `
        GAYRİMENKUL PAZARLAMA YETKİ BELGESİ
        
        MÜLK SAHİBİ: ${data.ownerName}
        TC NO: ${data.ownerId || '.........'}
        ADRES: ${data.propertyAddress}
        
        İŞBU BELGE İLE, YUKARIDA BİLGİLERİ VERİLEN TAŞINMAZIN SATIŞ/KİRALAMA 
        SÜRECİNDE TRİO EMLAK YETKİLİ KILINMIŞTIR.
        
        HİZMET BEDELİ: %2 + KDV
        SÜRE: ${data.duration || '6 Ay'}
        
        TARİH: ${new Date().toLocaleDateString('tr-TR')}
        SAHİP İMZA: __________  DANIŞMAN İMZA: __________
        `;
    }

    getShowingFormTemplate(data) {
        return `
        YER GÖSTERME BELGESİ
        
        DANIŞMAN: ${data.officerName}
        MÜŞTERİ: ${data.clientName}
        TAŞINMAZ: ${data.propertyTitle} (${data.price} TL)
        
        MÜŞTERİ, YUKARIDA BELİRTİLEN TAŞINMAZI TRİO EMLAK ARACILIĞI İLE GÖRMÜŞTÜR.
        BU TAŞINMAZIN SATIN ALINMASI DURUMUNDA HİZMET BEDELİ ÖDEMEYİ KABUL EDER.
        
        TARİH: ${new Date().toLocaleString('tr-TR')}
        MÜŞTERİ İMZA: __________
        `;
    }

    getSalesAgreementTemplate(data) {
        return `
        TAŞINMAZ SATIŞ VAADİ VE ARACILIK SÖZLEŞMESİ (PROTOKOL)
        
        ALICI: ${data.buyerName}
        SATICI: ${data.sellerName}
        MÜLK: ${data.propertyTitle}
        SATIŞ BEDELİ: ${data.price} TL
        KAPORA: ${data.deposit || '..........'} TL
        
        ŞARTLAR:
        1. Tapu devri en geç ${data.deadline || '30 gün içinde'} yapılacaktır.
        2. Hizmet bedeli taraflarca ${data.commission || '%2'} oranında ödenecektir.
        
        TARİH: ${new Date().toLocaleDateString('tr-TR')}
        ALICI: ______  SATICI: ______  ARACI: ______
        `;
    }
}

module.exports = new DocumentGeneratorService();
