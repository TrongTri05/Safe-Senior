package vn.edu.fpt.safe_senior.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.edu.fpt.safe_senior.dto.response.OrderItemResponse;
import vn.edu.fpt.safe_senior.dto.response.OrderResponse;
import vn.edu.fpt.safe_senior.entity.Order;
import vn.edu.fpt.safe_senior.entity.OrderItem;

@Mapper(componentModel = "spring")
public interface OrderMapper {
    @Mapping(target = "orderId", source = "id")
    OrderResponse toOrderResponse(Order order);

    @Mapping(target = "deviceId", source = "product.device.deviceId")
    OrderItemResponse toOrderItemResponse(OrderItem item);
}
