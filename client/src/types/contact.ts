export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
}

export interface ContactData {
  email: string;
  address: {
    az: string;
    ru: string;
  };
  address2: {
    az: string;
    ru: string;
  };
  whatsapp: string;
  phone: string;
  workingHours: {
    az: {
      weekdays: string;
      sunday: string;
    };
    ru: {
      weekdays: string;
      sunday: string;
    };
  };
  socialLinks?: SocialLinks;
}
