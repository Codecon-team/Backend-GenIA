export interface PaymentRequest {
    transaction_amount: number;
    description: string;
    email: string;
    first_name: string;
    last_name: string;
    cpf: string;
    userId?: number; 
  }
  
  export interface PaymentResponse {
    id: number;
    status: string;
    status_detail: string;
    date_created: string;
    date_of_expiration: string;
    payment_method_id: string;
    payment_type_id: string;
    transaction_amount: number;
    point_of_interaction: {
      transaction_data: {
        qr_code: string;
        qr_code_base64: string;
        ticket_url: string;
      };
    };
    payer: {
      email: string | null;
      identification: {
        type: string | null;
        number: string | null;
      };
    };
  }