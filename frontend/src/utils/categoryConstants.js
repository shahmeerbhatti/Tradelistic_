// Category and Subcategory constants
export const CATEGORY_OPTIONS = [
  { value: 'electronics', label: 'Electronics', icon: 'fas fa-microchip' },
  { value: 'fashion', label: 'Fashion', icon: 'fas fa-tshirt' },
  { value: 'home', label: 'Home & Living', icon: 'fas fa-home' },
  { value: 'books', label: 'Books', icon: 'fas fa-book' },
  { value: 'others', label: 'Others', icon: 'fas fa-ellipsis-h' },
];

export const SUBCATEGORY_OPTIONS = {
  electronics: [
    { value: 'laptops', label: 'Laptops' },
    { value: 'mobile_phones', label: 'Mobile Phones' },
    { value: 'tablets', label: 'Tablets' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'cameras', label: 'Cameras' },
  ],
  fashion: [
    { value: 'mens_clothing', label: "Men's Clothing" },
    { value: 'womens_clothing', label: "Women's Clothing" },
    { value: 'shoes', label: 'Shoes' },
    { value: 'bags', label: 'Bags' },
    { value: 'jewelry', label: 'Jewelry' },
  ],
  home: [
    { value: 'furniture', label: 'Furniture' },
    { value: 'kitchen', label: 'Kitchen & Dining' },
    { value: 'bedding', label: 'Bedding' },
    { value: 'decor', label: 'Home Decor' },
    { value: 'appliances', label: 'Appliances' },
  ],
  books: [
    { value: 'fiction', label: 'Fiction' },
    { value: 'non_fiction', label: 'Non-Fiction' },
    { value: 'educational', label: 'Educational' },
    { value: 'comics', label: 'Comics & Graphic Novels' },
    { value: 'magazines', label: 'Magazines' },
  ],
  others: [
    { value: 'sports', label: 'Sports & Fitness' },
    { value: 'toys', label: 'Toys & Games' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'automotive', label: 'Automotive' },
    { value: 'office', label: 'Office Supplies' },
  ],
};
