export const MINUTA_EMAIL_JOB_KEY = "minutas-email";
export const MINUTA_EMAIL_JOB_NAME = "minutas-email";
export const MINUTA_EMAIL_SCHEDULE_LABEL = "Evento manual desde Minutas";

export class MinutaEmailLogService {
  static getJobKey() {
    return MINUTA_EMAIL_JOB_KEY;
  }

  static getJobName() {
    return MINUTA_EMAIL_JOB_NAME;
  }

  static getScheduleLabel() {
    return MINUTA_EMAIL_SCHEDULE_LABEL;
  }
}
