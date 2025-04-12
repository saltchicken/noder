from typing import Any
from dataclasses import dataclass


@dataclass
class CaptionedImage:
    image: str
    caption: str


@dataclass
class CaptionedVideo:
    video: str
    caption: str


class Node:
    def __init__(self):
        self.instantiated = True
        self.node_id = None
        print(f"Node initialized {self.__class__.__name__}")
        self.widgets = []
        self.websocket = None
        self.output_dir = "../user/output"  # TODO: Make this an env variable

    async def send_message(self, message_type: str, data: dict):
        if self.websocket:
            await self.websocket.send_json(
                {
                    "type": "node_message",
                    "data": {
                        "nodeId": self.node_id,
                        "message": {"type": message_type, "data": data},
                    },
                }
            )

    async def set_status(self, status):
        """Update node's running status"""
        await self.send_message("status", status)

    async def update_widget(self, widget_name, value):
        """Update a widget's value during node execution"""
        await self.send_message("widget_update", {"name": widget_name, "value": value})

    async def update_widget_options(self, widget_name: str, options: list):
        """Update the options of a dropdown widget"""
        await self.send_message(
            "widget_update_options", {"name": widget_name, "options": options}
        )

    async def run(self, *args, **kwargs) -> Any:
        pass

    async def _run(self, *args, **kwargs):
        await self.set_status("run_start")
        result = await self.run(*args, **kwargs)
        await self.set_status("run_complete")
        if isinstance(result, (tuple, list)):
            return result
        return [result] if result is not None else []
