import type { Alert, Detector, ValidationContext } from '@/types/validation';

export const W003_outputCongested: Detector = {
    code: 'W003',
    level: 'warning',
    run(ctx: ValidationContext): Alert[] {
        const alerts: Alert[] = [];

        // 若無阻塞資料，直接回傳
        if (!ctx.congestedEdges) {
            return alerts;
        }

        for (const edgeId of ctx.congestedEdges) {
            const connection = ctx.connections.find((c) => c.id === edgeId);
            if (connection) {
                alerts.push({
                    uid: crypto.randomUUID(),
                    level: 'warning',
                    code: 'W003',
                    message: `管線輸出阻塞，無法排出全部流量`,
                    relatedDeviceUids: [connection.source],
                    relatedConnectionUids: [edgeId],
                });
            }
        }

        return alerts;
    },
};
