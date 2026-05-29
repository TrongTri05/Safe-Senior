package vn.edu.fpt.safe_senior.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.edu.fpt.safe_senior.dto.response.BuyProductResponse;
import vn.edu.fpt.safe_senior.dto.response.ProductResponse;
import vn.edu.fpt.safe_senior.entity.Device;
import vn.edu.fpt.safe_senior.entity.Product;

@Mapper(componentModel = "spring")
public interface ProductMapper {
    ProductResponse toProductResponse(Product product);
}
