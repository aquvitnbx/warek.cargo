export type HubSelection = 'JAKARTA' | 'SURABAYA' | 'MAKASSAR';
export type IntentType = 'INTAKE' | 'LOOKUP' | 'OTHER';
export type RecommendedAction =
  | 'PROCEED_TO_INTAKE'
  | 'PROCEED_TO_LOOKUP'
  | 'REPLY_ONBOARDING'
  | 'REPLY_RETURNING_ONBOARDING'
  | 'REPLY_HUB_CONFIRMATION'
  | 'REPLY_FIELD_EXPLANATION'
  | 'REPLY_CLARIFICATION'
  | 'REPLY_FALLBACK_ADMIN';
export type HumanReplyMode =
  | 'INTAKE_CONFIRMATION'
  | 'ONBOARDING'
  | 'RETURNING_ONBOARDING'
  | 'HUB_CONFIRMATION'
  | 'FIELD_EXPLANATION'
  | 'CLARIFICATION'
  | 'LOOKUP'
  | 'FALLBACK_ADMIN';

export type ExtractedPackage = {
  tracking_number: string;
  destination_city: string | null;
  item_description: string | null;
};

export type PartialSessionData = {
  recognized_name?: string;
  hub_selection?: HubSelection | null;
  customer_name?: string | null;
  packages?: ExtractedPackage[];
};

export type InterpretResult = {
  intent: IntentType;
  extracted_data: {
    hub_selection: HubSelection | null;
    customer_name: string | null;
    packages: ExtractedPackage[];
  };
  tracking_identifier: string | null;
  is_data_complete: boolean;
  missing_critical_fields: string[];
  requires_clarification: boolean;
  clarification_question: string | null;
  recommended_action: RecommendedAction;
  human_reply_mode: HumanReplyMode;
};

const GREETING_RE = /^(halo|hai|hi|p|ping|siang|sore|malam|pagi|halo min|permisi|assalamualaikum|assalamu'alaikum)[!.\s]*$/i;
const LOOKUP_VERB_RE = /(cek|lacak|tracking|status|posisi|sampai mana|dimana|di mana)/i;
const FIELD_EXPLANATION_RE = /(apa itu|maksud|gimana isi|format|contoh isi|contoh resi|hub itu apa|kota tujuan itu apa)/i;
const DESTINATION_CITIES = ['NABIRE', 'MAKASSAR', 'JAYAPURA', 'TIMIKA', 'SORONG', 'MERAUKE', 'BIAK', 'SERUI', 'MANOKWARI', 'WAMENA'];

function normalizeText(input: string) {
  return input.replace(/\s+/g, ' ').trim();
}

function extractTrackingNumbers(input: string) {
  const candidates = input.match(/\b[A-Za-z0-9][A-Za-z0-9/_-]{5,}\b/g) ?? [];
  const filtered = candidates.filter((value) => {
    const upper = value.toUpperCase();
    if (['JAKARTA', 'SURABAYA', 'MAKASSAR'].includes(upper)) return false;
    return /\d/.test(value) || /[-_/]/.test(value);
  });

  return [...new Set(filtered.map((value) => value.trim()))];
}

function extractHubSelection(input: string, fallback?: HubSelection | null): HubSelection | null {
  const upper = input.toUpperCase();
  if (upper.includes('JAKARTA')) return 'JAKARTA';
  if (upper.includes('SURABAYA')) return 'SURABAYA';
  if (upper.includes('MAKASSAR')) return 'MAKASSAR';
  return fallback ?? null;
}

function extractDestinationCity(input: string, fallback?: string | null) {
  const upper = input.toUpperCase();
  const matchedCity = DESTINATION_CITIES.find((city) => upper.includes(city));
  if (matchedCity) {
    return matchedCity.charAt(0) + matchedCity.slice(1).toLowerCase();
  }

  const tujuanMatch = input.match(/tujuan\s*[:\-]?\s*([A-Za-z ]{3,30})/i);
  if (tujuanMatch?.[1]) {
    return tujuanMatch[1].trim();
  }

  return fallback ?? null;
}

function extractCustomerName(input: string, fallback?: string | null) {
  const nameMatch = input.match(/(?:nama(?:\s+pemilik|\s+pengirim|\s+penerima)?|atas nama)\s*[:\-]\s*([^,\n]+)/i);
  if (nameMatch?.[1]) return nameMatch[1].trim();
  return fallback ?? null;
}

function extractItemDescription(input: string, fallback?: string | null) {
  const itemMatch = input.match(/(?:isi|barang|paket)\s*[:\-]\s*([^\n]+)/i);
  if (itemMatch?.[1]) return itemMatch[1].trim();
  return fallback ?? null;
}

function mergePackages(basePackages: ExtractedPackage[], incomingTrackingNumbers: string[], destinationCity: string | null, itemDescription: string | null) {
  const merged = [...basePackages];

  for (const trackingNumber of incomingTrackingNumbers) {
    const existingIndex = merged.findIndex((pkg) => pkg.tracking_number === trackingNumber);
    if (existingIndex >= 0) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        destination_city: merged[existingIndex].destination_city || destinationCity,
        item_description: merged[existingIndex].item_description || itemDescription,
      };
      continue;
    }

    merged.push({
      tracking_number: trackingNumber,
      destination_city: destinationCity,
      item_description: itemDescription,
    });
  }

  return merged;
}

function collectMissingFields(hubSelection: HubSelection | null, customerName: string | null, packages: ExtractedPackage[]) {
  const missing = new Set<string>();

  if (!hubSelection) missing.add('hub_selection');
  if (!customerName) missing.add('customer_name');
  if (packages.length === 0) {
    missing.add('packages');
  }

  packages.forEach((pkg, index) => {
    const position = index + 1;
    if (!pkg.destination_city) missing.add(`packages.${position}.destination_city`);
    if (!pkg.item_description) missing.add(`packages.${position}.item_description`);
  });

  return [...missing];
}

export function interpretIncomingMessage(message: string, partialData?: PartialSessionData): InterpretResult {
  const normalizedMessage = normalizeText(message);
  const trackingNumbers = extractTrackingNumbers(normalizedMessage);
  const hubSelection = extractHubSelection(normalizedMessage, partialData?.hub_selection ?? null);
  const customerName = extractCustomerName(normalizedMessage, partialData?.customer_name ?? partialData?.recognized_name ?? null);
  const fallbackDestination = partialData?.packages?.find((pkg) => pkg.destination_city)?.destination_city ?? null;
  const fallbackItem = partialData?.packages?.find((pkg) => pkg.item_description)?.item_description ?? null;
  const destinationCity = extractDestinationCity(normalizedMessage, fallbackDestination);
  const itemDescription = extractItemDescription(normalizedMessage, fallbackItem);
  const basePackages = Array.isArray(partialData?.packages) ? partialData.packages : [];
  const mergedPackages = mergePackages(basePackages, trackingNumbers, destinationCity, itemDescription);
  const isGreetingOnly = GREETING_RE.test(normalizedMessage);
  const isLookup = LOOKUP_VERB_RE.test(normalizedMessage) && trackingNumbers.length > 0;
  const recognizedName = partialData?.recognized_name ?? null;

  if (isLookup) {
    return {
      intent: 'LOOKUP',
      extracted_data: {
        hub_selection: hubSelection,
        customer_name: customerName,
        packages: mergedPackages.length > 0 ? mergedPackages : [{ tracking_number: trackingNumbers[0], destination_city: null, item_description: null }],
      },
      tracking_identifier: trackingNumbers[0],
      is_data_complete: true,
      missing_critical_fields: [],
      requires_clarification: false,
      clarification_question: null,
      recommended_action: 'PROCEED_TO_LOOKUP',
      human_reply_mode: 'LOOKUP',
    };
  }

  if (isGreetingOnly) {
    return {
      intent: 'OTHER',
      extracted_data: {
        hub_selection: hubSelection,
        customer_name: customerName,
        packages: mergedPackages,
      },
      tracking_identifier: null,
      is_data_complete: false,
      missing_critical_fields: [],
      requires_clarification: true,
      clarification_question: null,
      recommended_action: recognizedName ? 'REPLY_RETURNING_ONBOARDING' : 'REPLY_ONBOARDING',
      human_reply_mode: recognizedName ? 'RETURNING_ONBOARDING' : 'ONBOARDING',
    };
  }

  if (FIELD_EXPLANATION_RE.test(normalizedMessage)) {
    return {
      intent: 'OTHER',
      extracted_data: {
        hub_selection: hubSelection,
        customer_name: customerName,
        packages: mergedPackages,
      },
      tracking_identifier: null,
      is_data_complete: false,
      missing_critical_fields: [],
      requires_clarification: true,
      clarification_question: 'Format singkatnya: pilih hub penerimaan, lalu kirim nama pemilik barang, nomor resi, kota tujuan, dan isi paket.',
      recommended_action: 'REPLY_FIELD_EXPLANATION',
      human_reply_mode: 'FIELD_EXPLANATION',
    };
  }

  const missingCriticalFields = collectMissingFields(hubSelection, customerName, mergedPackages);
  const intakeSignal = Boolean(hubSelection || trackingNumbers.length > 0 || /resi|paket|barang|tujuan|isi/i.test(normalizedMessage) || basePackages.length > 0);

  if (intakeSignal) {
    if (hubSelection && !customerName && mergedPackages.length === 0) {
      return {
        intent: 'INTAKE',
        extracted_data: {
          hub_selection: hubSelection,
          customer_name: customerName,
          packages: mergedPackages,
        },
        tracking_identifier: null,
        is_data_complete: false,
        missing_critical_fields: ['customer_name', 'packages'],
        requires_clarification: true,
        clarification_question: null,
        recommended_action: 'REPLY_HUB_CONFIRMATION',
        human_reply_mode: 'HUB_CONFIRMATION',
      };
    }

    if (missingCriticalFields.length === 0) {
      return {
        intent: 'INTAKE',
        extracted_data: {
          hub_selection: hubSelection,
          customer_name: customerName,
          packages: mergedPackages,
        },
        tracking_identifier: null,
        is_data_complete: true,
        missing_critical_fields: [],
        requires_clarification: false,
        clarification_question: null,
        recommended_action: 'PROCEED_TO_INTAKE',
        human_reply_mode: 'INTAKE_CONFIRMATION',
      };
    }

    const clarifyText = missingCriticalFields.some((field) => field.includes('item_description'))
      ? 'Nomor resi sudah saya catat. Mohon informasikan isi barang untuk resi yang belum lengkap.'
      : missingCriticalFields.some((field) => field.includes('destination_city'))
        ? 'Mohon informasikan kota tujuan untuk paket yang belum lengkap.'
        : !hubSelection
          ? 'Mohon pilih dulu hub penerimaan: Jakarta, Surabaya, atau Makassar.'
          : !customerName
            ? 'Mohon informasikan nama pemilik barang.'
            : 'Mohon lengkapi data resi yang belum lengkap.';

    return {
      intent: 'INTAKE',
      extracted_data: {
        hub_selection: hubSelection,
        customer_name: customerName,
        packages: mergedPackages,
      },
      tracking_identifier: null,
      is_data_complete: false,
      missing_critical_fields: missingCriticalFields,
      requires_clarification: true,
      clarification_question: clarifyText,
      recommended_action: 'REPLY_CLARIFICATION',
      human_reply_mode: 'CLARIFICATION',
    };
  }

  return {
    intent: 'OTHER',
    extracted_data: {
      hub_selection: hubSelection,
      customer_name: customerName,
      packages: mergedPackages,
    },
    tracking_identifier: null,
    is_data_complete: false,
    missing_critical_fields: [],
    requires_clarification: true,
    clarification_question: null,
    recommended_action: 'REPLY_FALLBACK_ADMIN',
    human_reply_mode: 'FALLBACK_ADMIN',
  };
}
