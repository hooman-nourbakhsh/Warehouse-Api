const express = require("express");
const mongoose = require("mongoose");
const authenticateToken = require("../middleware/authMiddleware");
const Product = require("../models/Product");
const router = express.Router();

// GET all products with pagination and search parameters
router.get("/", async (req, res) => {
  try {
    let { page = 1, limit = 10, name, minPrice, maxPrice } = req.query;

    page = Math.max(1, parseInt(page));
    limit = Math.max(1, parseInt(limit));

    let query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
    }

    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      return res.status(400).json({ message: "minPrice cannot be greater than maxPrice" });
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    if (page > totalPages && totalPages > 0) {
      return res.status(400).json({
        message: `Page ${page} is out of bounds. There are only ${totalPages} pages.`,
      });
    }

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formattedProducts = products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      price: Number(product.price),
      quantity: Number(product.quantity),
    }));

    res.json({
      totalProducts,
      page,
      limit,
      totalPages,
      data: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a specific product by ID (public)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({
      id: product._id.toString(),
      name: product.name,
      price: Number(product.price),
      quantity: Number(product.quantity),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new product (protected)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, price, quantity } = req.body;
    const product = new Product({
      name,
      price: Number(price),
      quantity: Number(quantity),
    });

    const savedProduct = await product.save();

    res.status(201).json({
      id: savedProduct._id.toString(),
      name: savedProduct.name,
      price: Number(savedProduct.price),
      quantity: Number(savedProduct.quantity),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT to update an existing product (protected)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, { ...req.body }, { new: true, runValidators: true }).lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      id: product._id.toString(),
      name: product.name,
      price: Number(product.price),
      quantity: Number(product.quantity),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a product by ID (protected)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE multiple products (protected)
router.delete("/", authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: "IDs should be an array" });
    }

    // اعتبارسنجی تمام IDها
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      return res.status(400).json({ message: "Some IDs are invalid" });
    }

    const result = await Product.deleteMany({ _id: { $in: validIds } });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "No products found to delete" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
