import { IDiagnosisProvider } from './diagnosisProvider.interface';
import { IDiagnosisResult } from '../types';

interface DiseaseKnowledge {
  crop: string;
  disease: string;
  confidence: number;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Healthy' | 'Unknown';
  symptoms: string[];
  causes: string[];
  organicTreatment: string[];
  chemicalTreatment: string[];
  prevention: string[];
}

const KNOWLEDGE_BASE: DiseaseKnowledge[] = [
  {
    crop: 'Tomato',
    disease: 'Early Blight (Alternaria solani)',
    confidence: 89,
    severity: 'Moderate',
    symptoms: [
      'Concentric dark brown circular spots (target-board appearance) on older leaves',
      'Yellow chlorotic halos surrounding lesions',
      'Lower leaves drying up and dropping prematurely',
    ],
    causes: [
      'Fungal pathogen Alternaria solani',
      'High humidity (over 80%) with temperatures between 24-29°C',
      'Overhead irrigation splashing soil spores onto lower foliage',
    ],
    organicTreatment: [
      'Prune and destroy infected lower leaves immediately using disinfected shears',
      'Apply copper hydroxide or potassium bicarbonate spray every 7-10 days',
      'Spray neem oil extract (5ml/L) to deter fungal spore germination',
    ],
    chemicalTreatment: [
      'Mancozeb 75% WP at 2-2.5g per litre of water at first symptom appearance',
      'Chlorothalonil broad-spectrum protective fungicide during wet weather',
    ],
    prevention: [
      'Implement a 3-year crop rotation with non-solanaceous crops',
      'Use straw or plastic mulching to prevent soil splash on leaves',
      'Water at the base of the plant using drip irrigation rather than overhead spray',
      'Ensure proper spacing (60cm x 45cm) for air circulation',
    ],
  },
  {
    crop: 'Paddy / Rice',
    disease: 'Blast (Magnaporthe oryzae)',
    confidence: 84,
    severity: 'Severe',
    symptoms: [
      'Spindle-shaped or diamond-shaped lesions with gray-white centers and reddish-brown borders',
      'Collapsing leaf tips and neck rot on panicles',
    ],
    causes: [
      'Fungus Magnaporthe oryzae',
      'Excessive nitrogen fertilizer application',
      'High relative humidity and cloudy days with low night temperatures',
    ],
    organicTreatment: [
      'Spray pseudomonas fluorescens liquid formulation (10ml/L)',
      'Apply fermented cow dung & neem cake wash extract',
    ],
    chemicalTreatment: [
      'Tricyclazole 75% WP at 0.6g per litre of water',
      'Kasugamycin 3% SL at 2.5ml per litre during active outbreak',
    ],
    prevention: [
      'Use certified blast-resistant seed varieties (e.g., Bg 300 series)',
      'Avoid excessive chemical nitrogen fertilizer, split into 3 balanced doses',
      'Maintain continuous water depth of 2-5cm during susceptible stages',
    ],
  },
  {
    crop: 'Chilli',
    disease: 'Anthracnose / Fruit Rot (Colletotrichum capsici)',
    confidence: 91,
    severity: 'Moderate',
    symptoms: [
      'Sunken circular necrotic spots on chilli pods with concentric rings',
      'Small black specks (acervuli) in lesion centers',
      'Yellowing and premature drop of maturing fruit',
    ],
    causes: [
      'Colletotrichum capsici fungal spores spread by wind and rain splash',
      'Warm and humid microclimate in dense planting',
    ],
    organicTreatment: [
      'Spray Trichoderma viride biological formulation (5g/L)',
      'Collect and incinerate all infected mummified pods from the ground',
    ],
    chemicalTreatment: [
      'Azoxystrobin 23% SC at 1ml per litre of water',
      'Carbendazim 50% WP as preventative spray',
    ],
    prevention: [
      'Treat seeds before planting with Trichoderma or hot water (52°C for 25 mins)',
      'Provide staked support to keep fruit from contacting wet soil',
      'Clean equipment thoroughly between field visits',
    ],
  },
  {
    crop: 'Tomato',
    disease: 'Healthy Crop (No Disease Detected)',
    confidence: 96,
    severity: 'Healthy',
    symptoms: [
      'Uniform green foliage with healthy turgid leaf texture',
      'No visible necrotic lesions, spots, or chlorosis',
    ],
    causes: [
      'Balanced soil nutrition and optimal watering regime',
    ],
    organicTreatment: [
      'Maintain weekly seaweed extract or compost tea foliar feeding',
    ],
    chemicalTreatment: [
      'No chemical treatment required. Avoid unnecessary pesticide applications.',
    ],
    prevention: [
      'Continue routine inspection every 3-4 days',
      'Maintain balanced N-P-K nutrient application',
    ],
  },
];

export class MockDiagnosisProvider implements IDiagnosisProvider {
  name = 'Mock Diagnosis Engine (Simulated Botanical Engine)';
  isMock = true;

  async analyzeImage(imagePath: string, cropHint?: string): Promise<IDiagnosisResult> {
    // Simulate slight processing latency (300ms) for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 350));

    let selected: DiseaseKnowledge = KNOWLEDGE_BASE[0];

    if (cropHint) {
      const match = KNOWLEDGE_BASE.find(
        (k) => k.crop.toLowerCase().includes(cropHint.toLowerCase()) ||
               k.disease.toLowerCase().includes(cropHint.toLowerCase())
      );
      if (match) selected = match;
    }

    return {
      crop: selected.crop,
      disease: selected.disease,
      confidence: selected.confidence,
      severity: selected.severity,
      symptoms: selected.symptoms,
      causes: selected.causes,
      organicTreatment: selected.organicTreatment,
      chemicalTreatment: selected.chemicalTreatment,
      prevention: selected.prevention,
      isMock: true,
      provider: this.name,
      analyzedAt: new Date().toISOString(),
    };
  }
}
