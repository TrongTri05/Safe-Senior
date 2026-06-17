package vn.edu.fpt.safe_senior.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import vn.edu.fpt.safe_senior.dto.request.ProductCreateRequest;
import vn.edu.fpt.safe_senior.dto.request.ProductUpdateRequest;
import vn.edu.fpt.safe_senior.dto.request.UseCreateRequest;
import vn.edu.fpt.safe_senior.dto.request.UserUpdateRequest;
import vn.edu.fpt.safe_senior.dto.response.ProductResponse;
import vn.edu.fpt.safe_senior.entity.Product;
import vn.edu.fpt.safe_senior.entity.User;

@Mapper(componentModel = "spring")
public interface ProductMapper {
    @Mapping(source = "id", target = "id")
    @Mapping(source = "status", target = "status")
    @Mapping(source = "createdAt", target = "createdAt")
    @Mapping(source = "updatedAt", target = "updatedAt")
    ProductResponse toProductResponse(Product product);

    @Mapping(source = "name", target = "name")
    @Mapping(source = "status",target = "status")
    @Mapping(target = "device", ignore = true)
    Product toProduct(ProductCreateRequest request);


    void updateProduct(@MappingTarget Product product, ProductUpdateRequest request);
}
