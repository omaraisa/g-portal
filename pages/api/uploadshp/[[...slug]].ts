
import { NextApiRequest, NextApiResponse } from 'next';

const uploadShapefileService= process.env.uploadShapefileService;

export const config = {
  api: {
    bodyParser: false, 
    externalResolver: true, 
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const buffers: any[] = [];
  req
    .on('readable', () => {
      const chunk = req.read();
      if (chunk !== null) {
        buffers.push(chunk);
      }
    })
    .on('end', async () => {
        try {
          const result = await fetch(uploadShapefileService, {
            method: 'POST',
            credentials: 'include',
            mode: 'cors',
            headers: {
              'Content-Type': req.headers['content-type'] ?? 'multipart/form-data',
              'User-Agent': req.headers['user-agent'] ?? '',
              Authorization: 'Bearer Token',
            },
            body: Buffer.concat(buffers),
          });
          const body = await result.json();
          res.status(result.status).json(body);
          return;
        } catch (error) {
            console.log(error)
          res.status(500).json({status:"error",message:"عذراً فشلت عملية رفع الملف الى الخادم"});
        }
    });
};
export default handler;

