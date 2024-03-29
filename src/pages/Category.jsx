import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Promotions from "../components/Promotions";
import Filters from "../components/Filters";
import CategoryProducts from "../components/Products/CategoryProducts";
import ProfileProducts from "../components/Products/ProfileProducts";
import useFilter from "../hooks/useFilter";
import useSearch from "../hooks/useSearch";
import useSort from "../hooks/useSort";
import usePagination from "../hooks/usePagination";
import useGetFirestoreData from "../hooks/useGetFirestoreData";
import Loading from "../ui/Loading";
import { toast } from "react-toastify";
import electronics from "../assets/electronics.webp";
import watches from "../assets/watches.webp";

const Category = () => {
  const promotionsList = [
    {
      id: 1,
      title: "20% Off On Electronics",
      text: "Get unbeatable discounts on a wide range of electronics.",
      image: electronics,
      imageClasses: "!bg-center",
      path: "/category/k0H6JtUC44ZkLJMDTnSi",
    },
    {
      id: 2,
      title: "Latest Watches For You",
      text: "Enjoy amazing discounts on watches!",
      image: watches,
      imageClasses: "!bg-right-top",
      path: "/category/YCSCEBPGhYNqdrmdoGXL",
    },
  ];

  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);

  const {
    data: categoryData,
    isLoading: categoryDataLoading,
    error: categoryDataError,
  } = useGetFirestoreData("categories", id !== "all" ? id : null);

  const {
    data: categoryProducts,
    isLoading: categoryProductsLoading,
    error: categoryProductsError,
  } = useGetFirestoreData(
    "products",
    null,
    id !== "all" ? { lhs: "categoryId", op: "==", rhs: id } : null
  );

  const {
    data: reviews,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useGetFirestoreData("reviews");

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [priceValues, setPriceValues] = useState([
    searchParams.get("minPrice")
      ? parseInt(searchParams.get("minPrice"))
      : minPrice,
    searchParams.get("maxPrice")
      ? parseInt(searchParams.get("maxPrice"))
      : maxPrice,
  ]);
  const priceDistance = Math.ceil((maxPrice - minPrice) / 10);

  const defaultStockValue = 0;
  const [stockValue, setStockValue] = useState(
    searchParams.get("stock") && searchParams.get("stock") === "available"
      ? 1
      : defaultStockValue
  );

  const filterFunctions = [
    {
      filterFunction: (item) =>
        item.discount
          ? item.price - (item.price * item.discount) / 100 >= priceValues[0]
          : item.price >= priceValues[0],
      resetFunction: (item) =>
        item.discount
          ? item.price - (item.price * item.discount) / 100 >= minPrice
          : item.price >= minPrice,
      urlSearchParam: "minPrice",
      urlSearchDefaultValue: minPrice,
      urlSearchValue: priceValues[0],
    },
    {
      filterFunction: (item) =>
        item.discount
          ? item.price - (item.price * item.discount) / 100 <= priceValues[1]
          : item.price <= priceValues[1],
      resetFunction: (item) =>
        item.discount
          ? item.price - (item.price * item.discount) / 100 <= maxPrice
          : item.price <= maxPrice,
      urlSearchParam: "maxPrice",
      urlSearchDefaultValue: maxPrice,
      urlSearchValue: priceValues[1],
    },
    {
      filterFunction: (item) => item.stock >= stockValue,
      resetFunction: (item) => item.stock >= defaultStockValue,
      urlSearchParam: "stock",
      urlSearchDefaultValue: "all",
      urlSearchValue: stockValue === defaultStockValue ? "all" : "available",
    },
  ];

  const [products, setProducts] = useState([]);
  const [dataAfterFilters, applyFilters, resetFilters] = useFilter(
    products,
    filterFunctions
  );
  const [searchFunction, dataAfterSearch, inputValue] = useSearch(
    dataAfterFilters,
    "title"
  );
  const [setSortBy, setSortOrder, dataAfterSort, sortBy, sortOrder] = useSort(
    dataAfterSearch,
    "id"
  );
  const [elementsPerPage, setElementsPerPage] = useState({ id: 1, text: "12" });
  const [modifiedData, paginationOptions] = usePagination(
    dataAfterSort,
    parseInt(elementsPerPage.text)
  );

  const resetFunction = () => {
    setPriceValues([minPrice, maxPrice]);
    setStockValue(defaultStockValue);
    resetFilters();
  };

  const [activeLayout, setActiveLayout] = useState("grid");

  const searchHandler = (e) => {
    searchFunction(e.target.value);
  };

  useEffect(() => {
    if (categoryProducts && reviews) {
      const updatedProducts = categoryProducts.map((product) => {
        let productRating = 0;
        let productReviews = 0;
        for (const review of reviews) {
          if (review.productId === product.id) {
            productRating += review.rating;
            productReviews += 1;
          }
        }

        return {
          ...product,
          rating: productRating ? productRating / productReviews : 0,
          reviews: productReviews,
        };
      });
      setProducts(updatedProducts);
    }
  }, [categoryProducts, reviews]);

  useEffect(() => {
    if (!categoryDataLoading && categoryData && dataAfterSearch) {
      const searchParams = new URLSearchParams(location.search);

      const getMin = (arr) => {
        let newMin =
          arr?.reduce((min, product) => {
            const price = product.discount
              ? Math.floor(
                  product.price - (product.price * product.discount) / 100
                )
              : product.price;
            return price < min ? price : min;
          }, Infinity) || 0;

        return newMin === Infinity ? 0 : newMin;
      };

      const getMax = (arr) => {
        return (
          arr?.reduce((max, product) => {
            const price = product.discount
              ? Math.ceil(
                  product.price - (product.price * product.discount) / 100
                )
              : product.price;

            return price > max ? price : max;
          }, 0) || 0
        );
      };

      const newMin = getMin(categoryProducts);
      const newMax = getMax(categoryProducts);

      if (
        newMin === minPrice &&
        newMax === maxPrice &&
        (priceValues[0] !== minPrice || priceValues[1] !== maxPrice)
      ) {
        searchParams.set("minPrice", priceValues[0]);
        searchParams.set("maxPrice", priceValues[1]);
      } else if (
        !(
          (priceValues[0] !== minPrice || priceValues[1] !== maxPrice) &&
          newMin !== minPrice &&
          newMax !== maxPrice
        )
      ) {
        searchParams.set("minPrice", newMin);
        searchParams.set("maxPrice", newMax);
        setPriceValues([newMin, newMax]);
        setMinPrice(newMin);
        setMaxPrice(newMax);
      } else {
        setPriceValues([
          parseInt(searchParams.get("minPrice")),
          parseInt(searchParams.get("maxPrice")),
        ]);
        setMinPrice(newMin);
        setMaxPrice(newMax);
      }

      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      navigate(newUrl, { replace: true });
    }
  }, [id, categoryProducts, dataAfterSearch]);

  useEffect(() => {
    if (
      categoryProductsError ||
      (reviewsError &&
        !categoryDataLoading &&
        !reviewsLoading &&
        !categoryProductsLoading)
    ) {
      toast.error("An error occurred!");
    }
  }, [
    categoryDataLoading,
    categoryProductsError,
    categoryProductsLoading,
    reviewsError,
    reviewsLoading,
  ]);

  useEffect(() => {
    if (categoryDataError && !categoryDataLoading && id !== "all") {
      navigate("/");
      toast.error("There's no category with this id!");
    }
  }, [categoryDataError, categoryDataLoading, id, navigate]);

  if (
    categoryDataLoading ||
    categoryProductsLoading ||
    reviewsLoading ||
    !Number.isInteger(minPrice) ||
    !Number.isInteger(maxPrice)
  )
    return <Loading />;

  return (
    <div className="my-12">
      <Promotions promotions={promotionsList} />
      <h2 className="section-heading">
        {id !== "all" ? categoryData?.title : "All Products"}
      </h2>
      {priceValues && categoryProducts && products && (
        <Filters
          categoryId={id}
          minPrice={minPrice}
          maxPrice={maxPrice}
          priceDistance={priceDistance}
          priceValues={priceValues}
          setPriceValues={setPriceValues}
          stockValue={stockValue}
          setStockValue={setStockValue}
          filterFunction={applyFilters}
          resetFunction={resetFunction}
          searchInputValue={inputValue}
          onSearch={searchHandler}
          sortBy={sortBy}
          sortOrder={sortOrder}
          setSortBy={setSortBy}
          setSortOrder={setSortOrder}
          elementsPerPage={elementsPerPage}
          setElementsPerPage={setElementsPerPage}
          activeLayout={activeLayout}
          setActiveLayout={setActiveLayout}
        />
      )}
      {categoryProductsLoading && <Loading />}
      {!categoryProductsLoading && modifiedData.length === 0 && (
        <p>Found no products</p>
      )}
      {!categoryDataLoading &&
        modifiedData.length > 0 &&
        activeLayout === "grid" && (
          <CategoryProducts
            products={modifiedData}
            paginationOptions={paginationOptions}
            activeLayout={activeLayout}
          />
        )}
      {!categoryDataLoading &&
        modifiedData.length > 0 &&
        activeLayout === "list" && (
          <ProfileProducts
            products={modifiedData}
            paginationOptions={paginationOptions}
            activeLayout={activeLayout}
          />
        )}
    </div>
  );
};

export default Category;
