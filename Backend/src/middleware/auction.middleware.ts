import { Request, Response, NextFunction } from "express";

const validateAuction = (req: Request, res: Response, next: NextFunction) => {
  // Add your validation logic here
  next();
};

const createAuction = (req: Request, res: Response) => {
  // Add your create auction logic here
}

const getAuctions = (req: Request, res: Response) => {
  // Add your get auctions logic here
}

export default validateAuction;
